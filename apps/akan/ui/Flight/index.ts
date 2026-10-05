import { Assembly } from "./Assembly";
import { Avionics } from "./Avionics";
import { Comms } from "./Comms";
import { ControlLaws } from "./ControlLaws";
import { Cruise } from "./Cruise";
import { FlightLoader } from "./FlightLoader";
import { FlightShell } from "./FlightShell";
import { FlightTest } from "./FlightTest";
import { Preflight } from "./Preflight";
import { SheetRule } from "./SheetRule";
import { Takeoff } from "./Takeoff";
import { Tower } from "./Tower";

export const Flight = {
  Shell: FlightShell,
  Loader: FlightLoader,
  Assembly,
  Avionics,
  Tower,
  ControlLaws,
  Preflight,
  SheetRule,
  FlightTest,
  Takeoff,
  Comms,
  Cruise,
};
