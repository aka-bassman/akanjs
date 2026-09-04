import {
  formatBulletList,
  formatCallout,
  formatCheckList,
  formatCode,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
  insertCollapsible,
  insertDivider,
  insertTable,
} from "../blocks";
import type { EditorFeatureKey } from "../feature";
import { insertEmbed, insertExcalidraw, insertFile, insertImage, insertMermaid, insertVideo } from "../media";
import type { MentionSource } from "../mention.type";
import type { EditorSlashOption } from "../plugin";
import type { EditorUpload } from "../UploadContext";
import { openMentionSource } from "./mentionPlugin.command";
import { SlashOption } from "./slashMenuPlugin.option";

/** Opens a transient file picker and forwards the chosen file. */
const openFilePicker = (accept: string, onPick: (file: File) => void) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) onPick(file);
  };
  input.click();
};

interface BuildOptionsInput {
  upload: EditorUpload;
  /** The editor's enabled features. Every entry naming one the field does not have is dropped. */
  features: ReadonlySet<EditorFeatureKey>;
  extraOptions: readonly EditorSlashOption[];
  mentionSources: readonly MentionSource[];
}

/**
 * Builds the option set. The upload-backed media options (image/video/file) need uploads configured
 * on top of their feature; every other built-in entry is present exactly when its feature is.
 * `extraOptions` are the entries contributed by the editor's `plugins` and are never filtered —
 * passing the plugin is the opt-in — and each `mentionSources` entry gets a `/<label>` entry of its own.
 */
export const buildOptions = ({ upload, features, extraOptions, mentionSources }: BuildOptionsInput): SlashOption[] => {
  const options: SlashOption[] = [
    new SlashOption("paragraph", {
      label: "Paragraph",
      description: "Plain text",
      group: "text",
      keywords: ["p", "text", "plain"],
      run: formatParagraph,
    }),
    new SlashOption("h1", {
      feature: "heading",
      label: "Heading 1",
      description: "Big section heading",
      group: "text",
      keywords: ["title", "h1", "heading"],
      run: (editor) => formatHeading(editor, "h1"),
    }),
    new SlashOption("h2", {
      feature: "heading",
      label: "Heading 2",
      description: "Medium section heading",
      group: "text",
      keywords: ["subtitle", "h2", "heading"],
      run: (editor) => formatHeading(editor, "h2"),
    }),
    new SlashOption("h3", {
      feature: "heading",
      label: "Heading 3",
      description: "Small section heading",
      group: "text",
      keywords: ["h3", "heading"],
      run: (editor) => formatHeading(editor, "h3"),
    }),
    new SlashOption("bulleted", {
      feature: "list",
      label: "Bulleted list",
      description: "Create a simple bullet list",
      group: "list",
      keywords: ["unordered", "ul", "bullet"],
      run: formatBulletList,
    }),
    new SlashOption("numbered", {
      feature: "list",
      label: "Numbered list",
      description: "Create an ordered list",
      group: "list",
      keywords: ["ordered", "ol", "number"],
      run: formatNumberedList,
    }),
    new SlashOption("todo", {
      feature: "list",
      label: "Todo list",
      description: "Create a checklist",
      group: "list",
      keywords: ["check", "checkbox", "todo"],
      run: formatCheckList,
    }),
  ];

  if (upload.canUpload) {
    options.push(
      new SlashOption("image", {
        feature: "image",
        label: "Image",
        description: "Upload an image",
        group: "media",
        keywords: ["img", "photo", "picture"],
        run: (editor) =>
          openFilePicker("image/*", async (file) => {
            try {
              const uploaded = await upload.uploadFile(file, "image/*");
              const [width = 0, height = 0] = uploaded.imageSize ?? [];
              insertImage(editor, { fileId: uploaded.id, src: uploaded.url, alt: uploaded.filename, width, height });
            } catch (error) {
              upload.onError(error as Error);
            }
          }),
      }),
      new SlashOption("video", {
        feature: "video",
        label: "Video",
        description: "Upload a video",
        group: "media",
        keywords: ["movie", "mp4", "clip"],
        run: (editor) =>
          openFilePicker("video/*", async (file) => {
            try {
              const uploaded = await upload.uploadFile(file, "video/*");
              const [width = 0, height = 0] = uploaded.imageSize ?? [];
              insertVideo(editor, { fileId: uploaded.id, src: uploaded.url, width, height });
            } catch (error) {
              upload.onError(error as Error);
            }
          }),
      }),
      new SlashOption("file", {
        feature: "file",
        label: "File",
        description: "Upload a file",
        group: "media",
        keywords: ["attachment", "document", "pdf"],
        run: (editor) =>
          openFilePicker(upload.policy.accept, async (file) => {
            try {
              const uploaded = await upload.uploadFile(file);
              insertFile(editor, {
                fileId: uploaded.id,
                src: uploaded.url,
                name: uploaded.filename,
                size: uploaded.size,
                format: uploaded.filename?.split(".").pop(),
              });
            } catch (error) {
              upload.onError(error as Error);
            }
          }),
      }),
    );
  }

  options.push(
    new SlashOption("embed", {
      feature: "embed",
      label: "Embed",
      description: "Embed a YouTube / Vimeo URL",
      group: "media",
      keywords: ["youtube", "vimeo", "iframe", "video"],
      run: (editor) => insertEmbed(editor, {}),
    }),
    new SlashOption("excalidraw", {
      feature: "excalidraw",
      label: "Excalidraw",
      description: "Draw a diagram",
      group: "media",
      keywords: ["draw", "diagram", "sketch", "whiteboard"],
      run: (editor) => insertExcalidraw(editor, {}),
    }),
    new SlashOption("mermaid", {
      feature: "mermaid",
      label: "Mermaid",
      description: "Diagram from Mermaid syntax",
      group: "media",
      keywords: ["diagram", "flowchart", "sequence", "graph", "chart", "uml", "gantt"],
      run: (editor) => insertMermaid(editor),
    }),
    new SlashOption("table", {
      feature: "table",
      label: "Table",
      description: "Insert a 3×3 table",
      group: "structure",
      keywords: ["grid", "row", "column", "cell"],
      run: (editor) => insertTable(editor),
    }),
    new SlashOption("accordion", {
      feature: "collapsible",
      label: "Toggle",
      description: "Collapsible accordion section",
      group: "structure",
      keywords: ["accordion", "collapsible", "details", "expand", "fold"],
      run: (editor) => insertCollapsible(editor),
    }),
    new SlashOption("callout", {
      feature: "callout",
      label: "Callout",
      description: "Add a highlighted note",
      group: "structure",
      keywords: ["note", "info", "warning", "admonition"],
      run: (editor) => formatCallout(editor, "info"),
    }),
    new SlashOption("quote", {
      feature: "quote",
      label: "Quote",
      description: "Add a quote",
      group: "structure",
      keywords: ["blockquote", "citation"],
      run: formatQuote,
    }),
    new SlashOption("code", {
      feature: "code",
      label: "Code",
      description: "Add a code block",
      group: "structure",
      keywords: ["codeblock", "snippet", "pre"],
      run: formatCode,
    }),
    new SlashOption("divider", {
      feature: "divider",
      label: "Divider",
      description: "Separate content",
      group: "structure",
      keywords: ["hr", "line", "separator", "rule"],
      run: insertDivider,
    }),
  );

  for (const source of mentionSources) {
    options.push(
      new SlashOption(`mention:${source.refName}`, {
        feature: "mention",
        label: source.label,
        description: `Mention a ${source.label.toLowerCase()}`,
        group: "reference",
        keywords: [source.refName, "mention", ...(source.keywords ?? [])],
        run: (editor) => openMentionSource(editor, source),
      }),
    );
  }

  for (const option of extraOptions) {
    options.push(
      new SlashOption(option.key, {
        label: option.label,
        description: option.description,
        group: option.group ?? "structure",
        keywords: option.keywords,
        run: option.run,
      }),
    );
  }

  return options.filter((option) => !option.feature || features.has(option.feature));
};

/** Case-insensitive match against label + keywords. */
export const matchesQuery = (option: SlashOption, query: string) => {
  const q = query.toLowerCase();
  if (option.label.toLowerCase().includes(q)) return true;
  return option.keywords.some((keyword) => keyword.includes(q));
};
