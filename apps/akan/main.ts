import { AkanApp } from "akanjs/server";

const run = async () => {
  await new AkanApp("./server", {
    openapi: true,
    mcp: {
      instructions:
        "The Akan.js framework documentation. Use searchDocPages to find pages by keyword and readDocPage to read one in full; listDocPages gives the whole index when you need to see what exists. Read the docs before writing Akan code — the conventions section in particular is enforced by lint and will fail a build if guessed at.",
    },
  }).start();
};
void run();
