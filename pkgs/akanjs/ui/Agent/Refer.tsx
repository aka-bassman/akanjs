"use client";
import { cn } from "akanjs/client";
import { AiOutlineClose } from "react-icons/ai";
import { type MessageReference, Reference } from "use-agentic";

export interface ReferenceChipsProps {
  className?: string;
  // Drawn from what a host handed `session.refer`, so the label is read defensively for the reason the attachment
  // chip reads its preview that way: a chip that throws takes the whole transcript down with it.
  references: readonly MessageReference[];
  /** Omitted for a sent message: what is already on the wire cannot be taken back. */
  onRemove?: (key: string) => void;
  removeLabel?: string;
}

/**
 * What the user pointed at, beside what they are typing. Keyed on the pointer rather than on the row's position:
 * the order a message's references appear in is its text's, and removing one is removing its token.
 */
export const ReferenceChips = ({ className, references, onRemove, removeLabel }: ReferenceChipsProps) => (
  <div className={cn("flex flex-wrap gap-1", className)}>
    {references.map((reference) => {
      const key = Reference.keyOf(reference);
      return (
        <span
          className="flex items-center gap-1 rounded-field bg-primary/10 px-2 py-0.5 text-primary text-xs"
          key={key}
          title={key}
        >
          <span className="max-w-32 truncate">{reference.label || key}</span>
          {onRemove ? (
            <button
              aria-label={removeLabel}
              className="text-primary/50 hover:text-primary"
              onClick={() => onRemove(key)}
              type="button"
            >
              <AiOutlineClose />
            </button>
          ) : null}
        </span>
      );
    })}
  </div>
);
