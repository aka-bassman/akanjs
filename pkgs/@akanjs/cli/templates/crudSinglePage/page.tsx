import type { AppInfo, LibInfo } from "akanjs";

interface Dict {
  Model: string;
  model: string;
  appName: string;
}
export default function getContent(scanInfo: AppInfo | LibInfo | null, dict: Dict) {
  return {
    filename: "_index.tsx",
    content: `
import { ${dict.Model}, fetch, usePage } from "@apps/${dict.appName}/client";
import type { PageConfig } from "akanjs/client";
import { buttonRecipe, Model } from "akanjs/ui";

export default async function Page() {
  const { l } = usePage();
  const [{ ${dict.model}InitInPublic }] = await Promise.all([fetch.init${dict.Model}InPublic()]);
  return (
    <>
      <div className="flex animate-fadeIn items-center gap-4 px-4 pt-4">
        <div className="font-bold text-lg md:text-4xl">{l("${dict.model}.modelName")}</div>
        <Model.New
          className={buttonRecipe({ size: "sm", variant: "ghost" })}
          slice={fetch.slice.${dict.model}InPublic}
          renderTitle="id"
        >
          <${dict.Model}.Template.General />
        </Model.New>
      </div>
      <${dict.Model}.Zone.Card
        className="mt-2 grid w-full animate-fadeIn grid-cols-1 justify-center gap-4 md:grid-cols-2 xl:grid-cols-3"
        init={${dict.model}InitInPublic}
      />
    </>
  );
}
export const pageConfig = { transition: "none" } satisfies PageConfig;
`,
  };
}
