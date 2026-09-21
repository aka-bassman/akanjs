import { usePage } from "@apps/akan/client";
import {
  type CommandReferenceItem,
  CommandReferenceSlide,
  Divider,
  Docs,
  DocsToc,
  type ReferenceRow,
} from "@apps/akan/ui";
import { Scroll } from "@libs/util/ui";
import { page } from "akanjs/client";

const hostOption: ReferenceRow = {
  name: "--host",
  type: "String",
  defaultValue: "akan cloud",
  enumOrFlag: "-",
  desc: "Cloud host to target. Defaults to the Akan Cloud host.",
};

export default page().render(() => {
  const { l } = usePage();

  const commands: CommandReferenceItem[] = [
    {
      name: "login",
      signature: "akan login [--host <host>]",
      desc: "Login to Akan Cloud services for the current workspace.\nUse it before cloud-assisted flows that require credentials, account state, or remote project access.",
      options: [hostOption],
      examples: `akan login
akan login --host https://cloud.example.com`,
    },
    {
      name: "logout",
      signature: "akan logout [--host <host>]",
      desc: "Logout from Akan Cloud services for the current workspace.\nUse it to clear the active cloud session when switching accounts or removing cloud access from the local environment.",
      options: [hostOption],
      examples: "akan logout",
    },
    {
      name: "update",
      signature: "akan update [--tag <tag>] [--registry <npm|local>]",
      desc: "Update Akan.js framework packages using the selected release tag.\nUse `latest` for normal updates and prerelease tags such as `beta`, `rc`, or `canary` only when intentionally testing that channel.\n`--registry local` resolves the packages from the local registry at `AKAN_NPM_REGISTRY` instead of npm, which is how a framework build is tried before it is published.",
      options: [
        {
          name: "--tag",
          type: "String",
          defaultValue: "latest",
          enumOrFlag: "latest | dev | canary | beta | rc | alpha",
          desc: "Akan.js update tag.",
        },
        {
          name: "--registry",
          type: "String",
          defaultValue: "npm",
          enumOrFlag: "npm | local",
          desc: "Registry the Akan packages are resolved from. `local` reads AKAN_NPM_REGISTRY, defaulting to http://127.0.0.1:4873. Asked for when the workspace runs on local akan packages.",
        },
      ],
      examples: `akan update
akan update --tag latest
akan update --tag beta
akan update --registry local`,
    },
    {
      name: "download-env",
      signature: "akan download-env [--host <host>]",
      desc: "Download the workspace's environment values into `env/`.\nRun it after cloning the repository and whenever someone else uploads a change, because env values are never committed.\nA workspace that declares a cloud workspace id logs in and reads from the cloud; one that does not falls back to the SCP target.",
      options: [hostOption],
      examples: "akan download-env",
    },
    {
      name: "upload-env",
      signature: "akan upload-env [--host <host>]",
      desc: "Upload this workspace's environment values from `env/` to the same place `download-env` reads from.\nThe archive is replaced whole, so upload after a download rather than over a stale local copy.",
      options: [hostOption],
      examples: "akan upload-env",
    },
  ];

  return (
    <Scroll>
      <Scroll.Slide id="cloud-cli" title={l.trans({ en: "Cloud CLI", ko: "Cloud CLI" })}>
        <Docs.Title>{l.trans({ en: "Cloud CLI", ko: "Cloud CLI" })}</Docs.Title>
        <Docs.Description>
          <div>
            {l.trans({
              en: "Cloud commands cover the optional Akan Cloud helpers: authentication, environment value transfer, and framework updates. Everything that talks to a cloud takes `--host`, so a self-hosted one is reached with the same commands.",
              ko: "Cloud command는 선택적인 Akan Cloud helper를 다룹니다. authentication, environment 값 전송, framework update가 여기에 속합니다. cloud와 통신하는 명령은 모두 `--host`를 받으므로 self-hosted cloud도 같은 명령으로 접근합니다.",
            })}
          </div>
          <div>
            {l.trans({
              en: "Internal deployment commands marked `devOnly: true` are intentionally not documented here.",
              ko: "`devOnly: true`로 표시된 internal deployment command는 의도적으로 이 문서에서 제외합니다.",
            })}
          </div>
        </Docs.Description>
      </Scroll.Slide>
      <Divider />
      {commands.map((command) => (
        <CommandReferenceSlide key={command.name} command={command} />
      ))}
      <DocsToc />
    </Scroll>
  );
});
