import "./flight.css";

import type { ReactNode } from "react";
import { FlightFooter } from "./FlightFooter";
import { FlightHeader } from "./FlightHeader";

interface FlightShellProps {
  children: ReactNode;
}
export const FlightShell = ({ children }: FlightShellProps) => {
  return (
    <div className="flt relative min-h-svh overflow-x-clip break-keep">
      <FlightHeader />
      {children}
      <FlightFooter />
    </div>
  );
};
