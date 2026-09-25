export const viaLocal = () => logger.log("x"); // @flag
export const viaStatic = () => Logger.log("x"); // @flag
export class ViaField { run() { this.logger.log("x"); } } // @flag
export class ViaPrivateField { run() { this.#logger.log("x"); } } // @flag
