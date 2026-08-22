"use client";
import { cn, usePage } from "akanjs/client";
import type { PendingApproval } from "use-agentic";
import { Button } from "../Button";

interface ApprovalProps {
  className?: string;
  approval: PendingApproval;
}

export default function Approval({ className, approval }: ApprovalProps) {
  const { l } = usePage();
  return (
    <div className={cn("flex flex-col gap-2 border-warning/30 border-t bg-warning/10 px-4 py-3", className)}>
      <p className="text-sm">{approval.message}</p>
      <pre className="scrollbar-thin max-h-24 overflow-auto rounded-field bg-background/60 p-2 font-mono text-[10px]">
        {JSON.stringify(approval.args, null, 2)}
      </pre>
      <div className="flex justify-end gap-2">
        <Button onClick={() => approval.reject()} size="xs" variant="ghost">
          {l("base.decline")}
        </Button>
        <Button onClick={approval.approve} size="xs">
          {l("base.approve")}
        </Button>
      </div>
    </div>
  );
}
