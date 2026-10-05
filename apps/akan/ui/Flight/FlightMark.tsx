import { cn } from "akanjs/client";

interface FlightMarkProps {
  className?: string;
}
export const FlightMark = ({ className }: FlightMarkProps) => {
  return (
    <svg aria-hidden="true" className={cn("fill-current", className)} viewBox="0 0 32 32">
      <path d="M16 1 L17.3 7.2 L18.6 11.4 L20.4 15 L30.5 22.2 L30.5 24.3 L22.6 23.6 L23.4 29.6 L19.6 27.2 L17.6 29.4 L16 30 L14.4 29.4 L12.4 27.2 L8.6 29.6 L9.4 23.6 L1.5 24.3 L1.5 22.2 L11.6 15 L13.4 11.4 L14.7 7.2 Z" />
    </svg>
  );
};
