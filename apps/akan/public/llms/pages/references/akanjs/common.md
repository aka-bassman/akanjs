# akanjs/common

- Source: /references/akanjs/common
- Mirror: /llms/pages/references/akanjs/common.md
- Section: references
- Category: AkanJS Reference
- Priority: P0

## Headings

- akanjs/common (#akanjs-common)
- Logger (#Logger)
- sleep (#sleep)
- capitalize / lowerlize (#capitalize / lowerlize)
- formatPhone / isPhoneNumber (#formatPhone / isPhoneNumber)
- isEmail (#isEmail)
- RestClient (#RestClient)
- pathGet / pathSet (#pathGet / pathSet)
- randomPick / randomPicks (#randomPick / randomPicks)

## Content

akanjs/common

Call

Result

Writes leveled log lines and hands them to the sinks you register.

Waits the given number of milliseconds.

Changes the case of the first character only.

Adds dashes to a Korean phone number and checks the dashed form.

Checks that a string looks like an email address.

Calls a REST API that is not an Akan server.

Reads and writes a nested value by a path such as `items[0].name`.

Picks one or several random items from a list.

Keeps a number between `min` and `max`.

Adds thousands separators to a number string and keeps the decimals as written.

Tells whether a `YYYY-MM-DD` string, `Date` or `Dayjs` parses, though `2024-02-30` still passes.

Tells whether a value is a `Dayjs`.

Splits "1.2.3" into major, minor and patch, and joins them back.

Copy data fields without methods, and only `plainFieldsOf` keeps a model's `Date` fields.

Makes a deep plain copy, JSON-ready when you pass `serializable` or `convertDate`.

Reads a JWT's payload without checking its signature, so never trust it for access.

Tells whether a value can be awaited.

Fills `{name}` placeholders and leaves one whose value is missing as written.

One method per level: `trace`, `verbose`, `debug`, `info`, `warn`, `error`.

The same methods as statics, with `name` defaulting to `App`.

Changes the console level while the process runs.

Tells whether a line at that level would go anywhere, before you build a costly message.

Passes each record at or above `minLevel` to your function and returns its remover.

Stops passing records to that sink.

Writes one record with `key=value` attributes after the message.

The console level, below which lines are not printed.

The level the container's stdout carries, and it overrides `AKAN_PUBLIC_LOG_LEVEL` when set.

The floor for a sink that sets no `minLevel`.

Joined in front of a relative path, while an absolute `http(s)` URL ignores it.

Sent with every request, and a call's own `headers` win on a clash.

Aborts a slower request; unset means no limit, and a call's own `timeout` wins.

Sends GET and resolves with the response body.

Sends POST with `data` as the body.

Sends PUT with `data` as the body.

Sends DELETE.

Returns the value at `path`, or `fallback` when a step is missing or `null`.

Writes `value` in place, creating missing objects and arrays, and returns the same `obj`.

One random item, or `undefined` for an empty list.

`count` random items, never the same one twice unless `allowDuplicate` is on.

On this page

Export

More in akanjs/common

The same import also carries route-convention helpers and wire contracts that the framework uses itself. App code rarely needs them.

Logger

A script that logs through an instance, a static call, a structured record and a sink:

Methods

Environment variables

Log Levels

The six levels, their severity numbers and what each one is for.

File Logging & Rotation

Where the log file lives and how it rotates.

sleep

capitalize / lowerlize

formatPhone / isPhoneNumber

isEmail

The shared sign-up form disables its button the same way:

RestClient

Constructor options

Method

pathGet / pathSet

Read or write a value deep inside an object by a path string. Reach for them when the path is data, such as a field name held in a variable.

Signature

The same path in three spellings, and a write that builds what is missing:

randomPick / randomPicks

One pick, two distinct picks, and three picks that may repeat:

## Code Examples

### apps/myapp/script/syncInvoices.ts

```typescript
import { Logger } from "akanjs/common";

const logger = new Logger("InvoiceSync");
logger.info("invoice synced");
logger.warn("retrying charge", "stripe");

Logger.warn("missing optional config", "startup");

Logger.emit({
  level: "info",
  name: "InvoiceSync",
  message: "charge settled",
  attrs: { amount: 1200, apiKey: "sk_live_..." },
}); // ... charge settled amount=1200 apiKey=[redacted]

const errorLines: string[] = [];
const removeSink = Logger.addSink(
  ({ plainMessage }) => {
    errorLines.push(plainMessage);
  },
  { minLevel: "error" },
);
removeSink();
```

### libs/shared/webkit/addFileUntilActive.ts

```typescript
import { fetch } from "@libs/shared/client";
import { sleep } from "akanjs/common";

while (file.status === "uploading") {
  await sleep(1000);
  file = await fetch.file(file.id);
}
```

### apps/myapp/common/modelNames.ts

```typescript
import { capitalize, lowerlize } from "akanjs/common";

const ModelName = capitalize("story"); // "Story"
const modelName = lowerlize("Story"); // "story"
capitalize("aKan"); // "AKan": only the first character changes
```

### apps/myapp/lib/user/User.Template.tsx

```tsx
"use client";
import { st, usePage } from "@apps/myapp/client";
import { Field } from "akanjs/ui";

export const General = () => {
  const { l } = usePage();
  const userForm = st.use.userForm();
  return (
    <Field.Phone
      label={l("user.phone")}
      value={userForm.phone}
      onChange={st.do.setPhoneOnUser}
    />
  );
};
```

### apps/myapp/lib/org/Org.Util.tsx

```tsx
"use client";
import { st, usePage } from "@apps/myapp/client";
import { isEmail } from "akanjs/common";
import { Button } from "akanjs/ui";

export const Invite = () => {
  const { l } = usePage();
  const inviteEmail = st.use.inviteEmail();
  return (
    <Button
      disabled={!isEmail(inviteEmail)}
      onClick={() => st.do.inviteMember()}
    >
      {l("org.inviteMember")}
    </Button>
  );
};
```

### apps/myapp/srvkit/exampleApi.ts

```typescript
import { RestClient } from "akanjs/common";

const api = new RestClient({
  baseUrl: "https://api.example.com",
  headers: { "X-Client": "myapp" },
  timeout: 20_000,
});

const user = await api.get<{ id: string; name: string }>("/users/1");
const requestId = crypto.randomUUID();
await api.post(
  "/events",
  { type: "signup", userId: user.id },
  { headers: { "X-Request-Id": requestId } },
);
```

### apps/myapp/common/profilePath.ts

```typescript
import { pathGet, pathSet } from "akanjs/common";

const user = {
  profile: { nickname: "akan" },
  links: [{ url: "https://akanjs.com" }],
};

pathGet("profile.nickname", user); // "akan"
pathGet("links[0].url", user); // "https://akanjs.com"
pathGet(["links", 0, "url"], user); // "https://akanjs.com"
pathGet("profile.age", user, ".", 0); // 0

pathSet(user, "profile.nickname", "Akan"); // returns user, now changed
pathSet(user, "tags[0]", "core"); // creates tags: ["core"]
```

### apps/myapp/lib/story.signal.spec.ts

```typescript
import { randomPick, randomPicks } from "akanjs/common";

const color = randomPick(["red", "blue", "green"]);
const tags = randomPicks(["api", "ui", "db"], 2); // two different tags
const rolls = randomPicks([1, 2, 3, 4, 5, 6], 3, true); // repeats allowed
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Respect server/client subpath boundaries when importing Akan APIs.

