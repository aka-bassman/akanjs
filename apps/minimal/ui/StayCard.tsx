import { Image, Link } from "akanjs/ui";
import { AiFillStar } from "react-icons/ai";

import { appCard } from "./Recipe";

interface StayCardProps {
  className?: string;
  href: string;
  image: string;
  title: string;
  caption: string;
  rating?: string;
  price?: string;
}
export const StayCard = ({ className, href, image, title, caption, rating, price }: StayCardProps) => {
  return (
    <Link href={href} className={appCard(undefined, ["block overflow-hidden rounded-[1.75rem]", className])}>
      <Image src={image} alt={title} width={600} height={400} className="h-44 w-full object-cover md:h-52" />
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{title}</p>
          <p className="mt-1 line-clamp-2 text-foreground/50 text-sm">{caption}</p>
        </div>
        <div className="shrink-0 text-right">
          {rating ? (
            <p className="flex items-center justify-end gap-1 text-sm">
              <AiFillStar className="text-warning" /> {rating}
            </p>
          ) : null}
          {price ? <p className="mt-1 font-semibold text-primary">{price}</p> : null}
        </div>
      </div>
    </Link>
  );
};
