import { cn } from "akanjs/client";
import { Link } from "akanjs/ui";
import { FaLink } from "react-icons/fa";

interface ExternalLinkProps {
  className?: string;
  href: string;
  label: string;
}
export const ExternalLink = ({ className, href, label }: ExternalLinkProps) => (
  <Link
    href={href}
    target="_blank"
    rel="noreferrer"
    className={cn(
      "ml-1 inline-flex size-5 -translate-y-px items-center justify-center rounded-full bg-foreground/50 align-baseline text-background transition-colors hover:bg-foreground/70",
      className,
    )}
    aria-label={label}
    title={label}
  >
    <FaLink className="size-2.5" />
  </Link>
);
