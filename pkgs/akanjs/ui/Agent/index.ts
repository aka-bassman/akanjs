import { AgentScope } from "use-agentic";
import Context from "./Context";
import { Dock } from "./Dock";
import { Guide } from "./Guide";
import { Chat } from "./index_";
import Section from "./Section";
import StateKey from "./StateKey";
import Tool from "./Tool";
import Transcript from "./Transcript";
import { Zone } from "./Zone";

export const Agent = { Chat, Context, Dock, Guide, Scope: AgentScope, Section, StateKey, Tool, Transcript, Zone };
