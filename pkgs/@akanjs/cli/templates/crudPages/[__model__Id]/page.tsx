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
import { buttonRecipe, Link } from "akanjs/ui";

interface PageProps {
  params: { ${dict.model}Id: string };
}

export function generateHead({ params }: PageProps) {
  const { ${dict.model}Id } = params;
  return (
    <>
      <title>{${dict.model}Id}</title>
      <meta name="description" content={${dict.model}Id} />
      <meta property="og:title" content={${dict.model}Id} />
      <meta property="og:description" content={${dict.model}Id} />
    </>
  );
}
export default async function Page({ params }: PageProps) {
  const { l } = usePage();
  const { ${dict.model}Id } = params;
  const [{ ${dict.model}, ${dict.model}View }] = await Promise.all([fetch.view${dict.Model}(${dict.model}Id)]);
  return (
    <div className="container flex flex-col gap-4">
      <div className="flex items-center gap-4 font-bold text-lg">
        <${dict.Model}.Zone.View view={${dict.model}View} />
        <Link className={buttonRecipe()} href={\`/${dict.model}/\${${dict.model}.id}/edit\`}>
          {l("base.updateModel", { model: l("${dict.model}.modelName") })}
        </Link>
      </div>
    </div>
  );
}
export const pageConfig = { transition: "none" } satisfies PageConfig;
`,
  };
}
