# Script

- Source: /cheatsheet/dev/script
- Mirror: /llms/pages/cheatsheet/dev/script.md
- Section: cheatsheet
- Category: Development
- Priority: P2

## Headings

- Scripts (#overview)
- Create And Run (#command)
- Server Lifecycle (#lifecycle)
- Use Services (#service)
- Lookup Helpers (#lookup)
- Change Data Safely (#tips)

## Content

Script

Command

Form

Good for

A file in `script/` you can review and rerun

Seed data, migrations, checks, small maintenance fixes

A prompt that is gone when you close it

Inspecting a service, trying a query, one small operator command

Server Console

Inspect services and try queries at a prompt.

akan script Reference

The command's signature and arguments.

optional

The app name, needed with a file name. Left out, it asks from a list or uses the only app.

A file directly in `script/`; the `.ts` suffix is optional. Leave it out to pick from a list.

Finds by

Call

What you get

Class

A service, signal or adaptor instance, fully typed.

Role

The storage adaptor the app actually uses, whatever its implementation.

A service.

A signal, when the script should run signal logic.

An adaptor, for infrastructure work.

Scripts

A script is a TypeScript file that boots your app's server, does one job, and exits. Reach for it when the job should live in a file rather than at a prompt:

Create And Run

Arguments

Both arguments may be left out, and the command then asks. They are positional, so the app comes first:

Server Lifecycle

Use Services

Do the work through services rather than direct database writes. A service already knows the domain rules, the database access and its other dependencies.

Lookup Helpers

Change Data Safely

A script that changes data should show what it is about to do before it does it. Three habits cover most of it:

Here is the script from above with the first two habits added:

Run it once to read the count, then again to apply it:

## Code Examples

### Terminal

```bash
akan script koyo hello
```

### apps/koyo/script/hello.ts

```ts
import { server } from "../server";

const run = async () => {
  await server.start();

  try {
    console.info("hello from script");
  } finally {
    await server.stop();
  }
};

void run();
```

### apps/koyo/script/finishServedOrders.ts

```ts
import { server, srv } from "../server";

const run = async () => {
  await server.start();

  try {
    const icecreamOrderService = server.get(srv.IcecreamOrderService);
    const servedOrders = await icecreamOrderService.listByStatuses(["served"]);

    console.info("served orders", servedOrders.length);

    for (const order of servedOrders) {
      await icecreamOrderService.finishIcecreamOrder(order.id);
    }
  } finally {
    await server.stop();
  }
};

void run();
```

### apps/koyo/script/finishServedOrders.ts

```ts
import { getEnv } from "akanjs/base";
import { server, srv } from "../server";

const isApply = process.env.APPLY === "1";

const run = async () => {
  await server.start();

  try {
    console.info(`environment: ${getEnv().environment}, apply: ${isApply}`);

    const icecreamOrderService = server.get(srv.IcecreamOrderService);
    const servedOrders = await icecreamOrderService.listByStatuses(["served"]);

    console.info("served orders", servedOrders.length);
    if (!isApply) return;

    for (const order of servedOrders) {
      await icecreamOrderService.finishIcecreamOrder(order.id);
    }
  } finally {
    await server.stop();
  }
};

void run();
```

### Terminal

```bash
akan script koyo finishServedOrders
APPLY=1 akan script koyo finishServedOrders
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

