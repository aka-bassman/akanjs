"use client";
import { useAgentGuide } from "use-agentic";

export interface GuideProps {
  instructions: string;
}

/** Joins the turn's instructions while mounted; renders nothing. */
export const Guide = ({ instructions }: GuideProps) => {
  useAgentGuide(instructions);
  return null;
};
