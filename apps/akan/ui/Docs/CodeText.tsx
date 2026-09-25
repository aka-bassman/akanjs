import { cloneElement, isValidElement, type ReactNode } from "react";

interface CodeTextProps {
  children: ReactNode;
}

const renderText = (text: string, key: string): ReactNode => {
  if (!text.includes("`")) return text;
  return text.split(/`([^`\n]+)`/).map((part, idx) => (idx % 2 ? <code key={`${key}-${idx}`}>{part}</code> : part));
};

const renderNode = (node: ReactNode, key: string): ReactNode => {
  if (typeof node === "string") return renderText(node, key);
  if (Array.isArray(node)) return node.map((child, idx) => renderNode(child, `${key}-${idx}`));
  if (!isValidElement(node)) return node;
  const props = node.props as { children?: ReactNode };
  if (props.children == null || typeof props.children === "function") return node;
  return cloneElement(node, undefined, renderNode(props.children, `${key}-c`));
};

export const CodeText = ({ children }: CodeTextProps) => <>{renderNode(children, "code")}</>;
