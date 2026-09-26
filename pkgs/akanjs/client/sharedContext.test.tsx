import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { sharedContext } from "./sharedContext";

const sources = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : sources(path);
    return /\.tsx?$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name) ? [path] : [];
  });

describe("sharedContext", () => {
  test("a second evaluation of the same module gets the object the first one made", () => {
    expect(sharedContext("interningTest", 0)).toBe(sharedContext("interningTest", 0));
    expect(sharedContext("interningTest", 0)).not.toBe(sharedContext("otherTest", 0));
  });

  test("a module reaching for a client-only react API declares itself a client module", () => {
    // The directive keeps the module out of an app's server graph, where `react` is `react.react-server.js`; the RSC
    // worker honours no directive, so `server/rscWorkerBoot.test.ts` guards that graph instead.
    const root = `${import.meta.dir}/..`;
    const clientOnly =
      /^(createContext|useState|useEffect|useLayoutEffect|useContext|useRef|useReducer|useSyncExternalStore|useImperativeHandle)$/;
    const undeclared = [...sources(`${root}/client`), ...sources(`${root}/ui`)]
      .filter((path) => {
        const source = readFileSync(path, "utf8");
        const named = source.match(/import\s*\{([^}]*)\}\s*from\s*"react"/)?.[1];
        if (!named) return false;
        const bindings = named.split(",").map((one) => one.trim());
        // A `type` import is erased before the module ever loads, so it never reaches the server graph.
        const reaches = bindings.filter((one) => !one.startsWith("type ")).some((one) => clientOnly.test(one));
        return reaches && !/^\s*"use client"/.test(source);
      })
      .map((path) => path.slice(root.length + 1));
    expect(undeclared).toEqual([]);
  });

  test("nothing in the client or ui facet makes a context the plain way", () => {
    // A plain `createContext` breaks only once an app bundles it into several chunks, so only a scan catches it.
    const root = `${import.meta.dir}/..`;
    const offenders = [...sources(`${root}/client`), ...sources(`${root}/ui`)]
      .filter((path) => !path.endsWith("/client/sharedContext.ts"))
      .filter((path) => /createContext[<(]/.test(readFileSync(path, "utf8")))
      .map((path) => path.slice(root.length + 1));
    expect(offenders).toEqual([]);
  });
});
