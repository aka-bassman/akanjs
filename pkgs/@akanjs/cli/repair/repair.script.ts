import { script } from "@akanjs/devkit/commandDecorators";
import type { WorkflowFormat } from "@akanjs/devkit/workflow";
import { Logger } from "akanjs/common";
import { type RepairKind, RepairRunner, type RepairTarget } from "./repair.runner";

export class RepairScript extends script("repair", [RepairRunner]) {
  async repair(kind: string, options: RepairTarget & { format?: WorkflowFormat }) {
    Logger.rawLog(await this.repairRunner.repair(kind as RepairKind, options));
  }
}
