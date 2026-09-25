# Model.Util.tsx

- Source: /conventions/module/util
- Mirror: /llms/pages/conventions/module/util.md
- Section: conventions
- Category: Domain
- Priority: P1

## Headings

- Model.Util.tsx (#util-overview)
- File Convention (#file-convention)
- Model Wrapper Actions (#model-wrapper-actions)
- Dialog And Modal Actions (#dialog-modal-actions)
- Query And Route Helpers (#query-context-utils)
- Rules And Common Mistakes (#practical-rules)

## Content

Model.Util.tsx

Always a client file

"use client" goes on line 1 by file role. A Util exists to handle a click, a hook or the store.

Named after its action

Name it after the verb without the model, such as Remove, Resolve or SetOrg. The namespace adds the model.

Takes ids, not models

A model prop would cross the server-client boundary as a class instance. Read the rest from the store.

Calls, never decides

It calls a store action or a Model wrapper. Who may act and what changes is decided by the service and document.

Components from `akanjs/ui` that run a module's generated edit or remove flow for you.

The client store: `st.do.x()` runs an action, and `st.use.x()` reads a key and re-renders on change.

Slice metadata that tells a wrapper which model and list to act on. It sends no request.

The arguments a slice list was loaded with, such as the project ids that filter a ticket list.

Sits beside the module's other files. A service module may have one; a scalar module may not.

Always line 1, above the imports. Template and Zone carry it too; Unit and View never do.

Named exports only. Callers write `Project.Util.Remove`, so no name repeats the model.

Declared right above its component and named after it. It takes ids and plain values.

One flat import for `fetch`, `st` and `usePage`. UI pieces come from `akanjs/ui`.

Draws an Edit button that opens its Template child in an edit modal.

Its children become the trigger. It asks for confirmation, then removes the record.

A stricter remove that shows the record's `name`. `typeNameToRemove` makes the user retype it.

The args the slice list was last loaded with, as an array in the slice's arg order.

Takes one value per slice arg, then reloads the list and insight from page 1.

The current path without the locale prefix, such as `/board/abc/post/1`.

A wrapper from `akanjs/ui` whose click calls `router.back()`.

View

Form

Logic

The Util's job

A button that runs one store action.

Wrappers that open the generated edit and remove flows.

A dialog trigger, and the draft value only that dialog uses.

Filter controls that change a slice list's query args.

Helpers that read the route to decide what to show.

Another file's job

fields and markup

A Unit draws one row, and a View draws one record in full.

A form whose fields are bound to the store.

who may act, what changes

Business rules run on the server, in the service and document.

multi-step async flow

A store action that the Util calls in one line.

Mistake

Instead

Write `isOwner ? <Remove /> : null`, the house form for conditional render.

Pass the setter by reference; the arrow hides the field from the agent and fails lint.

Load data in the page and pass it down; `akan quality ssr` flags a mount-time load.

Lint rejects `fetch.init*` in a client file. Reload with `st.do.initTicketInSelf()`.

A Util with no click, hook or store is server work. Move it to a Unit or View.

How a Unit places a Util button beside its link.

Every generated slice action, including setQueryArgsOf.

Every prop of Model.Edit, Model.Remove and the other wrappers.

In-Page Agent

How st.tool publishes a button to the agent.

A Util file holds a module's small client components, each doing one action: a remove button, a toolbox, a dialog trigger, a filter control or a back link.

Clicks and store actions gather here, so Unit and View stay server-rendered and Page, Zone and Template keep to their own jobs.

Words used on this page

Term

File Convention

The rules in the file

Part

Model Wrapper Actions

Most Utils are thin controls around the Model wrappers. A toolbox gathers several of them, so the Unit or Zone that shows it stays small.

Wrapper

A project toolbox in a dropdown menu. Only the owner sees the remove item:

Dialog And Modal Actions

When an action needs a confirmation or a small input first, its dialog lives in the same Util. First decide where the open state lives:

Inside the dialog

In the store

Local state: SetOrg

SetOrg picks an organization in a dialog, then saves it to the business license:

Store state: Resolve

Resolve keeps the modal key in the store, so a store action opens the modal:

Query And Route Helpers

Filter controls and route-aware helpers are Utils too. They read store or route state, then call a generated action or a router helper.

What they use

Changing a filter

QueryMakerInSelf keeps the project filter of the ticketInSelf list and clears its assignee filter:

Reading the route

BackButton shows a back link only on pages under one board:

Rules And Common Mistakes

What belongs in a Util, and which file takes everything else:

The work

Belongs here

Not here

Writing a Util

Common mistakes

Related pages

## Code Examples

### apps/koyo/lib/product/Product.Util.tsx

```ts
"use client";
import { fetch, usePage } from "@apps/koyo/client";
import { Model } from "akanjs/ui";
import { BiTrash } from "react-icons/bi";

interface RemoveProps {
  productId: string;
}
export const Remove = ({ productId }: RemoveProps) => {
  const { l } = usePage();
  return (
    <Model.Remove modelId={productId} slice={fetch.slice.product}>
      <BiTrash /> {l("base.remove")}
    </Model.Remove>
  );
};
```

### apps/koyo/lib/project/Project.Util.tsx

```ts
interface ToolboxProps {
  projectId: string;
  name: string;
  isOwner: boolean;
}
export const Toolbox = ({ projectId, name, isOwner }: ToolboxProps) => {
  const { l } = usePage();
  const archive = st
    .tool("archiveProject")
    .desc("Archive one project.")
    .arg("projectId", ID)
    .exec((id) => st.do.archiveProject(id));
  return (
    <Dropdown
      value={<AiOutlineMore />}
      content={
        <>
          <li>
            <Model.Edit renderTitle="name" slice={fetch.slice.projectInOrg} modelId={projectId}>
              <Project.Template.General />
            </Model.Edit>
          </li>
          <li>
            <button onClick={() => void archive(projectId)}>{l("project.archiveProject")}</button>
          </li>
          {isOwner ? (
            <li>
              <Model.SureToRemove slice={fetch.slice.project} modelId={projectId} name={name} />
            </li>
          ) : null}
        </>
      }
    />
  );
};
```

### apps/koyo/lib/bizLicense/BizLicense.Util.tsx

```ts
interface SetOrgProps {
  bizLicenseId: string;
}
export const SetOrg = ({ bizLicenseId }: SetOrgProps) => {
  const { l } = usePage();
  const [orgId, setOrgId] = useState<string | null>(null);
  return (
    <Dialog>
      <Dialog.Trigger>
        <button className={buttonRecipe()}>{l("bizLicense.setOrg")}</button>
      </Dialog.Trigger>
      <Dialog.Modal>
        <Field.ParentId value={orgId} onChange={setOrgId} slice={fetch.slice.orgInSelf} />
        <Dialog.Action>
          <button
            className={buttonRecipe({ variant: "primary" })}
            disabled={!orgId}
            onClick={() => {
              if (orgId) void st.do.setOrgInBizLicense(bizLicenseId, orgId);
            }}
          >
            {l.trans({ en: "Save", ko: "저장" })}
          </button>
        </Dialog.Action>
      </Dialog.Modal>
    </Dialog>
  );
};
```

### apps/koyo/lib/report/Report.Util.tsx

```ts
interface ResolveProps {
  reportId: string;
}
export const Resolve = ({ reportId }: ResolveProps) => {
  const { l } = usePage();
  const reportModal = st.use.reportModal();
  return (
    <>
      <button onClick={() => void st.do.editReport(reportId, { modal: `resolve-${reportId}` })}>
        {l("report.resolveReport")}
      </button>
      <Modal open={reportModal === `resolve-${reportId}`} onCancel={st.do.resetReport}>
        <button onClick={() => void st.do.resolveReport(reportId)}>{l.trans({ en: "Confirm", ko: "확인" })}</button>
      </Modal>
    </>
  );
};
```

### apps/koyo/lib/ticket/Ticket.Util.tsx

```ts
export const QueryMakerInSelf = () => {
  const { l } = usePage();
  const [projectIds] = st.use.queryArgsOfTicketInSelf();
  return (
    <button onClick={() => void st.do.setQueryArgsOfTicketInSelf(projectIds, [])}>
      {l.trans({ en: "All Assignees", ko: "모든 담당자" })}
    </button>
  );
};
```

### apps/koyo/lib/board/Board.Util.tsx

```ts
interface BackButtonProps {
  id: string;
}
export const BackButton = ({ id }: BackButtonProps) => {
  const { l } = usePage();
  const path = st.use.path({ agent: false });
  if (!path.startsWith(`/board/${id}/`)) return null;
  return <Link.Back>{l.trans({ en: "Back", ko: "뒤로" })}</Link.Back>;
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Treat convention and generated-file rules as stronger than local style guesses.

