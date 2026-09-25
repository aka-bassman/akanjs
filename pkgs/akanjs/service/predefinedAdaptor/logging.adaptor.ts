import { Logger } from "akanjs/common";
import { adapt } from "../adapt";

export interface LoggingAdaptor {
  trace(name: string, msg: string, context?: string): void;
  verbose(name: string, msg: string, context?: string): void;
  debug(name: string, msg: string, context?: string): void;
  log(name: string, msg: string, context?: string): void;
  info(name: string, msg: string, context?: string): void;
  warn(name: string, msg: string, context?: string): void;
  error(name: string, msg: string, context?: string): void;
}

export class ConsoleLogger extends adapt("consoleLogger", () => ({})) implements LoggingAdaptor {
  trace(name: string, msg: string, context?: string): void {
    Logger.trace(msg, context, name);
  }
  verbose(name: string, msg: string, context?: string): void {
    Logger.verbose(msg, context, name);
  }
  debug(name: string, msg: string, context?: string): void {
    Logger.debug(msg, context, name);
  }
  log(name: string, msg: string, context?: string): void {
    Logger.info(msg, context, name);
  }
  info(name: string, msg: string, context?: string): void {
    Logger.info(msg, context, name);
  }
  warn(name: string, msg: string, context?: string): void {
    Logger.warn(msg, context, name);
  }
  error(name: string, msg: string, context?: string): void {
    Logger.error(msg, context, name);
  }
}
