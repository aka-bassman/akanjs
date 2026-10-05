import { DuetStage } from "./DuetStage";
import { FirstProject } from "./FirstProject";
import { GuardMatrix } from "./GuardMatrix";
import { AgentArrow, HumanArrow } from "./Pointer";
import { Recording } from "./Recording";
import { ScreenStory } from "./ScreenStory";
import { SecondProject } from "./SecondProject";
import { ServerStory } from "./ServerStory";
import { VideoSlot } from "./VideoSlot";
import { ViewDock } from "./ViewDock";
import { ViewRemote } from "./ViewRemote";
import { ViewSwitch } from "./ViewSwitch";

export const Duet = {
  Stage: DuetStage,
  ScreenStory,
  ServerStory,
  Matrix: GuardMatrix,
  Layers: FirstProject,
  Files: SecondProject,
  Video: VideoSlot,
  Recording,
  Switch: ViewSwitch,
  Dock: ViewDock,
  Remote: ViewRemote,
  AgentArrow,
  HumanArrow,
};
