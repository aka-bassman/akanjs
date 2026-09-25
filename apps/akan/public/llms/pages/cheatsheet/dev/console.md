# Console

- Source: /cheatsheet/dev/console
- Mirror: /llms/pages/cheatsheet/dev/console.md
- Section: cheatsheet
- Category: Development
- Priority: P2

## Headings

- Server Console (#overview)
- Local Console (#local)
- Multi-line Input (#multiline)
- Container Console (#container)
- Console Process (#lifecycle)
- Globals And Commands (#globals)
- Safety (#safety)

## Content

Console

Local development: boots the app from its source in the workspace.

Docker or Kubernetes: runs the `console.js` that `akan build` puts next to `main.js`.

Keep a value for later

Assign without a keyword, as in `users = service("user")`, since `const` and `let` last one command.

Print a block's result

End the block with `return <expr>`, which a lone expression does not need.

Finish an unfinished line

Keep typing at the `...` prompt until the open bracket, string or comment closes.

Throw away pending input

`.clear` or Ctrl+C.

Close the console

Ctrl+D, `.exit`, `.quit`, or Ctrl+C on an empty prompt.

It is `main`.

It is `cloud` or `edge`; unset, it counts as `cloud` unless the env is `local`.

It is `production`.

Local `akan console`

Not needed while `.env` keeps both the env and the mode at `local`.

Docker, Kubernetes

Always needed, since the image sets `NODE_ENV=production` and the mode to `cloud`.

The booted server instance.

The server config the app booted with (`env/env.server.<env>.ts`), which can hold secrets.

Look an instance up by its refName, as in `service("user")`.

Look an instance up by its service, signal or adaptor class, as in `get(srv.shared.UserService)`.

Lists the method names on an object's prototype chain, sorted.

Summarizes status, server mode, environment, and every registered service, signal and adaptor.

The app's generated exports, as `server.ts` exports them.

Lists the commands and the multi-line input rules.

Lists the console's globals, including the values you assigned.

Throws away the pending multi-line input.

Closes the console.

Follows the running server's logs through filters until `.tail off`.

Prints every buffered record of one request.

Scripts

Repeatable operator work, with a dry run.

Live Tail

Every filter `.tail` accepts, from the terminal.

Docker

Opening the console in a compose setup.

Kubernetes

Opening the console in a running pod.

Server Console

The server console is a JavaScript prompt inside your app's server. Use it to inspect services and run small operator commands.

Command

Local Console

Open it to inspect a service, call a method, or try a query without writing a script file. Run it from the workspace root with the app's name:

Multi-line Input

To

Do this

Container Console

When the flag is required

Setting

Refuses when

So where you open it decides whether you need the flag:

Where

Flag

Console Process

The console is a second process, not a window into the running one. It boots its own server next to the app, inside the same container or pod.

Shared With The App

Env, secrets, mounted volumes, network, and database access.

Not Shared

Globals And Commands

The console puts runtime helpers and the app's generated exports in scope, so most commands fit on one line.

Globals

Name

Dot commands

First commands

A few commands to get your bearings, one per line:

Safety

A change made in the console lands on real data at once, with no review step. Four habits keep that safe:

Related pages

## Code Examples

### Terminal

```bash
akan console myapp
```

### Terminal

```ts
const users = service("user");
const user = await users.getUser("6890f2c1f0a1b2c3d4e5f6a7");
return await users.updateUser(user.id, { nickname: "checked" });
```

### Terminal

```bash
docker exec -it myapp sh -lc 'AKAN_CONSOLE=1 bun console.js'
```

### Terminal

```bash
kubectl exec -it -n myapp-main deploy/app-deployment -c app -- \
  sh -lc 'AKAN_CONSOLE=1 bun console.js'
```

### Terminal

```ts
process.env.AKAN_PUBLIC_ENV
env
debug()
methods(service("user"))
await service("user").__count()
await get(srv.shared.UserService).__count()
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

