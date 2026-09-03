export const infoIsTheReplacement = () => logger.info("x"); // @ok
export const otherLevelsAreFine = () => logger.warn("x"); // @ok
export const anUnrelatedReceiverIsNotTheLadder = () => auditTrail.log("x"); // @ok
export const consoleIsBiomesOwnRule = () => console.log("x"); // @ok
