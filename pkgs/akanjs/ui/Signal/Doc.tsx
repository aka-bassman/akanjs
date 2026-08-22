"use client";
import { fetch, usePage } from "akanjs/client";
import { decodeJwtPayload, lowerlize, mcpRefusalOf } from "akanjs/common";
import { type Account, type FetchProxy, getDefaultAccount } from "akanjs/fetch";
import { st } from "akanjs/store";
import { type ReactNode, useEffect, useState } from "react";
import { AiOutlineCopy, AiOutlineSearch } from "react-icons/ai";
import { BiLock } from "react-icons/bi";
import { buttonRecipe } from "../Button";
import { Copy } from "../Copy";
import { Input } from "../Input";
import { Modal } from "../Modal";
import {
  Code,
  Collapse,
  dictText,
  docPill,
  docUi,
  Section,
  SummaryCard,
  SummaryGrid,
  segmentItemClass,
  segmentTrackClass,
  Toolbar,
  ToolbarField,
} from "../Reference";
import { endpointEntriesOf, isWsEndpoint } from "./endpointEntries";
import RestApi from "./RestApi";
import WebSocket from "./WebSocket";

export default function Doc() {
  return <div></div>;
}

interface DocSettingProps {
  guardNames?: string[];
  roleTypes?: string[];
  roleKeys?: { [key: string]: string };
  search?: string;
  onSearch?: (search: string) => void;
}
const DocSetting = ({
  guardNames = ["Public"],
  roleTypes = ["Public", "User", "Admin", "SuperAdmin"],
  roleKeys = { me: "Admin", self: "User" },
  search,
  onSearch,
}: DocSettingProps) => {
  const tryRoles = st.use.tryRoles({ agent: false });
  const tryAccount = st.use.tryAccount({ agent: false });
  useEffect(() => {
    st.set({ tryRoles: [...roleTypes] });
  }, []);
  const tryRoleForAll = roleTypes.every((roleType) => tryRoles.includes(roleType));
  const baseUrl = fetch.origin;
  const currentRoles = Object.entries(roleKeys)
    .filter(([key]) => !!tryAccount[key as keyof typeof tryAccount])
    .map(([, roleType]) => roleType);
  return (
    <Toolbar>
      <ToolbarField label="Base URL">
        <Copy text={baseUrl}>
          <button className={buttonRecipe({ variant: "ghost", size: "sm" }, "font-mono text-foreground/80")}>
            {baseUrl}
            <AiOutlineCopy className="text-foreground/40" />
          </button>
        </Copy>
      </ToolbarField>
      <ToolbarField label="Roles">
        <div className={segmentTrackClass}>
          <button
            className={segmentItemClass(tryRoleForAll)}
            onClick={() => {
              if (!tryRoleForAll) st.do.setTryRoles([...roleTypes]);
            }}
            type="button"
          >
            All
          </button>
          {roleTypes.map((roleType) => (
            <button
              key={roleType}
              className={segmentItemClass(!tryRoleForAll && tryRoles.includes(roleType))}
              onClick={() => {
                if (tryRoleForAll) st.do.setTryRoles([roleType]);
                else if (!tryRoles.includes(roleType)) st.do.setTryRoles([...tryRoles, roleType]);
                else if (tryRoles.length !== 1) st.do.setTryRoles(tryRoles.filter((t) => t !== roleType));
              }}
              type="button"
            >
              {roleType}
            </button>
          ))}
        </div>
      </ToolbarField>
      <ToolbarField label="Auth">
        <DocAuthModal>
          <button
            className={buttonRecipe({ variant: currentRoles.length ? "primary" : "outline", size: "sm" })}
            type="button"
          >
            <BiLock /> {currentRoles.length ? currentRoles.join(", ") : "Anonymous"}
          </button>
        </DocAuthModal>
      </ToolbarField>
      {onSearch ? (
        <Input
          className="ml-auto"
          icon={<AiOutlineSearch className="text-foreground/40" />}
          iconClassName="-mr-8 z-10 pl-3"
          inputClassName="w-56 pl-9"
          nullable
          onChange={onSearch}
          placeholder="Search endpoints"
          value={search ?? ""}
        />
      ) : null}
    </Toolbar>
  );
};
Doc.Setting = DocSetting;

interface DocAuthModalProps {
  children: ReactNode;
}
const DocAuthModal = ({ children }: DocAuthModalProps) => {
  const tryJwt = st.use.tryJwt({ agent: false });
  const [jwt, setJwt] = useState(tryJwt);
  const [modalOpen, setModalOpen] = useState(false);
  const decodedAccount = jwt ? decodeJwtPayload<Account>(jwt) : null;
  const accountStr = JSON.stringify(decodedAccount ?? getDefaultAccount(), null, 2);
  return (
    <>
      <div
        onClick={() => {
          setModalOpen(true);
          setJwt(tryJwt);
        }}
      >
        {children}
      </div>
      <Modal
        bodyClassName="flex flex-col gap-4"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
        }}
        title="Set JWT for Authorization"
        action={
          <button
            className={buttonRecipe({ variant: "primary" }, "w-full")}
            onClick={() => {
              st.set(
                decodedAccount
                  ? { tryJwt: jwt, tryAccount: decodedAccount }
                  : { tryJwt: null, tryAccount: getDefaultAccount() },
              );
              setModalOpen(false);
            }}
          >
            <BiLock /> Set Authorization
          </button>
        }
      >
        <div className="flex w-full flex-col gap-2">
          <div className={docUi.sectionLabel}>Bearer token</div>
          <Input
            inputClassName="w-full font-mono text-xs"
            placeholder="eyJhbGciOi…"
            value={jwt ?? ""}
            onChange={setJwt}
            validate={() => true}
          />
        </div>
        <Code code={accountStr} label="Account decoded" />
      </Modal>
    </>
  );
};
Doc.AuthModal = DocAuthModal;

interface DocSignalsProps {
  fetch: FetchProxy;
}
const DocSignals = ({ fetch }: DocSignalsProps) => {
  const signalEntries = Object.entries(fetch.serializedSignal).sort(([keyA], [keyB]) =>
    lowerlize(keyA) > lowerlize(keyB) ? 1 : -1,
  );
  return (
    <div className="flex flex-col gap-2">
      {signalEntries.map(([refName], idx) => (
        <DocSignal key={idx} refName={refName} fetch={fetch} />
      ))}
    </div>
  );
};

Doc.DocSignals = DocSignals;

interface DocSignalProps {
  refName: string;
  fetch: FetchProxy;
}
const DocSignal = ({ refName, fetch }: DocSignalProps) => {
  const { l } = usePage();
  const desc = dictText(l, `${refName}.modelDesc`);
  return (
    <Collapse
      summary={
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-lg">{refName}</span>
            <span className={docPill("muted")}>Signal</span>
          </div>
          {desc ? <div className="text-foreground/55 text-sm">{desc}</div> : null}
        </div>
      }
    >
      <RestApi.Endpoints refName={refName} fetch={fetch} />
    </Collapse>
  );
};
Doc.DocSignal = DocSignal;

interface ZoneProps {
  refName: string;
  fetch: FetchProxy;
  openAll?: boolean;
}
const Zone = ({ refName, fetch, openAll }: ZoneProps) => {
  const { l } = usePage();
  const [search, setSearch] = useState("");
  const desc = dictText(l, `${refName}.modelDesc`);
  const entries = endpointEntriesOf(refName, fetch);
  const wsEntries = entries.filter(({ endpoint }) => isWsEndpoint(endpoint));
  const mcpEntries = entries.filter(({ endpoint }) => !mcpRefusalOf(endpoint));
  return (
    <div className="flex break-after-page flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className={docUi.pageTitle}>{refName}</h1>
          <span className={docPill("muted")}>Signal</span>
        </div>
        {desc ? <p className={docUi.sectionDescription}>{desc}</p> : null}
      </div>
      <SummaryGrid>
        <SummaryCard label="Endpoints" value={entries.length} />
        <SummaryCard label="REST API" value={entries.length - wsEntries.length} />
        <SummaryCard label="Web Socket" value={wsEntries.length} />
        <SummaryCard label="MCP Tools" value={mcpEntries.length} />
      </SummaryGrid>
      <DocSetting onSearch={setSearch} search={search} />
      <Section title="REST API">
        <RestApi.Endpoints refName={refName} fetch={fetch} openAll={openAll} search={search} />
      </Section>
      <Section title="Web Socket">
        <WebSocket.Endpoints refName={refName} fetch={fetch} openAll={openAll} search={search} />
      </Section>
    </div>
  );
};
Doc.Zone = Zone;
