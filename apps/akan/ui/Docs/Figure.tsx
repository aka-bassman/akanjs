import { cn } from "akanjs/client";
import { Image } from "akanjs/ui";

interface FigureProps {
  className?: string;
  title: string;
  image: string;
  // Never rendered: script/generateDiagramImage.ts reads this literal from the page source to redraw `image`.
  prompt: string;
  alt: string;
  width?: number;
  height?: number;
}

export const Figure = ({ className, title, image, alt, width = 1536, height = 1024 }: FigureProps) => {
  return (
    <figure className={cn("my-4 overflow-hidden rounded-xl border border-border bg-muted/40", className)}>
      <figcaption className="border-border border-b px-4 py-2 font-bold text-foreground/70 text-sm">{title}</figcaption>
      <div className="p-4">
        <Image
          src={`/akanjsImage/diagrams/${image}.png`}
          alt={alt}
          width={width}
          height={height}
          unoptimized
          className="mx-auto h-auto w-full max-w-3xl mix-blend-multiply dark:mix-blend-screen dark:hue-rotate-180 dark:invert"
        />
      </div>
    </figure>
  );
};
