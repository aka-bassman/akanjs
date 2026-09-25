export type MarkdownSpan =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "em"; text: string }
  | { kind: "del"; text: string }
  | { kind: "link"; text: string; href: string }
  /** A link whose href was refused, or an image: rendered as its label, by every host. */
  | { kind: "plain"; text: string };

// The href alternation carries one level of nested parens, so a url that ends in one — a wiki title, a
// `javascript:alert(1)` this then refuses — is captured whole instead of cut at its first `)`.
const inline =
  /(!?)\[([^\]]*)\]\(((?:[^\s()]|\([^\s()]*\))+)\)|`([^`]+)`|\*\*([\s\S]+?)\*\*|\*([^*\n]+?)\*|~~([\s\S]+?)~~/g;

/**
 * The inline scanner both hosts read: a browser turns these into elements, a terminal into styled text.
 *
 * It is here rather than beside either renderer because the two decisions that matter are not rendering
 * decisions. **A link's scheme is refused for everyone** — this text comes from a model and from tool results
 * carrying stored user input, and React writes a `javascript:` href out as given. And **underscore emphasis is
 * deliberately unmatched**: snake_case is everywhere in this content, and `some_var_name` italicising mid-word
 * reads worse than a literal `_emphasis_` does.
 */
export class MarkdownSpans {
  static of(text: string): MarkdownSpan[] {
    const spans: MarkdownSpan[] = [];
    let cut = 0;
    for (const match of text.matchAll(inline)) {
      const at = match.index;
      const [, image, label, href, code, strong, em, del] = match;
      if (at > cut) spans.push({ kind: "text", text: text.slice(cut, at) });
      cut = at + match[0].length;
      if (href !== undefined)
        spans.push(
          image || !MarkdownSpans.isSafeHref(href)
            ? { kind: "plain", text: label ?? "" }
            : { kind: "link", text: label ?? "", href },
        );
      else if (code !== undefined) spans.push({ kind: "code", text: code });
      else if (strong !== undefined) spans.push({ kind: "strong", text: strong });
      else if (em !== undefined) spans.push({ kind: "em", text: em });
      else if (del !== undefined) spans.push({ kind: "del", text: del });
    }
    if (cut < text.length) spans.push({ kind: "text", text: text.slice(cut) });
    return spans;
  }

  static isSafeHref(href: string) {
    return !/^[a-z][a-z0-9+.-]*:/i.test(href) || /^(?:https?|mailto|tel):/i.test(href);
  }

  /** The text with every marker removed, for a host that has no styling to give — a width measurement, a log. */
  static plain(text: string): string {
    return MarkdownSpans.of(text)
      .map((span) => (span.kind === "link" ? span.text : span.text))
      .join("");
  }
}
