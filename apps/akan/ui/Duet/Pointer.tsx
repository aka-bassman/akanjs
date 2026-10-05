import { cn } from "akanjs/client";

interface HumanArrowProps {
  className?: string;
}
export const HumanArrow = ({ className }: HumanArrowProps) => {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 24"
      strokeWidth={1.4}
      strokeLinejoin="round"
      className={cn("h-6 w-4 fill-foreground stroke-background drop-shadow-md", className)}
    >
      <path d="M1.5 1.5v17.2l4.3-4.1 3 6.6 2.7-1.2-3-6.5h6z" />
    </svg>
  );
};
