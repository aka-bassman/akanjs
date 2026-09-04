import { type cnst, usePage } from "@libs/shared/client";
import { StatSection, StatTile } from "@libs/shared/ui";
import { cn } from "akanjs/client";

interface AccountProps {
  className?: string;
  summary: cnst.Summary;
}

export const Account = ({ className, summary }: AccountProps) => {
  const { l } = usePage();
  const groups = [
    { group: "userGroup", keys: ["activeUser", "prepareUser", "dormantUser", "restrictedUser"] },
    { group: "activeUserGroup", keys: ["hau", "dau", "wau", "mau"] },
  ] as const;
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {groups.map(({ group, keys }) => (
        <StatSection key={group} title={l(`summary.${group}`)}>
          {keys.map((key) => (
            <StatTile key={key} label={l(`summary.${key}`)} desc={l(`summary.${key}.desc`)} value={summary[key]} />
          ))}
        </StatSection>
      ))}
    </div>
  );
};
