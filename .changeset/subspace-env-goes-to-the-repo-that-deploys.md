---
"akanjs": minor
"@akanjs/devkit": minor
"@akanjs/cli": minor
---

`akan subspace upload-env <name>` sends one subspace's env to the cloud workspace it deploys from

A subspace's `env/` values were the one thing the mirror had no way to move. Push holds them back and pull
leaves them alone — deliberately, because the values belong to the repo that deploys — so getting a changed
value into a customer's deployment meant running `akan upload-env` from somewhere that had both the values and
that customer's `AKAN_WORKSPACE_ID`, which is nowhere: a workspace has every customer's values and exactly one
id, its own.

`SubspaceDeclaration` now carries an optional `workspaceId`, the cloud workspace that subspace deploys from,
and `akan subspace upload-env <name>` uploads against it. `akan.subspace.ts` is a workspace-only entry that no
push ever ships, so declaring every customer's id there puts none of them in a customer's repo.

What is uploaded is the slice a push ships — the declared apps, the libraries their closure pulls in, and those
apps' `secrets` globs — and nothing else. The whole workspace would be the simpler thing to send, and it is the
wrong one: an env archive is replaced whole on arrival, so one customer's cloud workspace would end up holding
every other customer's secrets. `CloudRunner.gatherEnvFiles` takes that scope and an archive path (the slice
lands in `local/env.<name>.tar`, never over the full `local/env.tar`), while the `akan:secrets` block it
maintains in the root `.gitignore` keeps being written from every app in the workspace — narrowing that file to
one slice would silently un-ignore every other app's secrets.

Because the upload replaces an archive in a repo you are not standing in, three things are refused rather than
guessed: a subspace with no `workspaceId`, a subspace declaring this workspace's own id (a slice uploaded there
would leave the workspace's next `download-env` short of every other app), and two subspaces declaring the same
id. The command asks for confirmation before it replaces anything, naming the subspace and the cloud workspace;
`-F, --force` skips the question, and with no terminal to ask in the command refuses instead of assuming yes.
(`-f` is already `--format` and `-y` already `--verify`.)

The direction is one-way on purpose. There is no `subspace download-env`: it would write a customer's values
over the workspace's own copies, and which of the two is right is not something a command can know.
