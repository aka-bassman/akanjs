import { DuetStage } from "./DuetStage";
import { FirstProject } from "./FirstProject";
import { GuardMatrix } from "./GuardMatrix";
import { HumanArrow } from "./Pointer";
import { ScreenStory } from "./ScreenStory";
import { SecondProject } from "./SecondProject";
import { ServerStory } from "./ServerStory";
import { ViewDock } from "./ViewDock";
import { ViewRemote } from "./ViewRemote";

export const Duet = {
  Stage: DuetStage,
  ScreenStory,
  ServerStory,
  Matrix: GuardMatrix,
  Layers: FirstProject,
  Files: SecondProject,
  Dock: ViewDock,
  Remote: ViewRemote,
  HumanArrow,
};
