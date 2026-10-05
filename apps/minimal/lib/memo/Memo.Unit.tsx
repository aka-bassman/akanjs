import type { cnst } from "@apps/minimal/client";
import type { ModelProps } from "akanjs/client";
import { Image, Link } from "akanjs/ui";
import { AiOutlineEdit, AiOutlineRight } from "react-icons/ai";

export const Card = ({ memo, href }: ModelProps<"memo", cnst.LightMemo>) => {
  return (
    <Link href={href} className="flex w-full items-center gap-3 rounded-3xl border border-foreground/10 bg-muted p-4">
      {memo.hasImage() ? (
        <Image
          src={memo.imageUrl}
          alt={memo.name}
          width={48}
          height={48}
          className="size-11 shrink-0 rounded-2xl object-cover"
        />
      ) : (
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary text-xl">
          <AiOutlineEdit />
        </div>
      )}
      <p className="min-w-0 flex-1 truncate font-semibold">{memo.name}</p>
      <AiOutlineRight className="text-foreground/40" />
    </Link>
  );
};
