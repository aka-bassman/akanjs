import { beforeAll, describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server.browser";
import { setTestEnv, stubSignal } from "../store/store.fixture";

let html: string;
let plainHtml: string;

beforeAll(async () => {
  setTestEnv("attrtest");

  const [{ Int }, { ConstantRegistry, via }, storeFacet, { registerClientRuntime }, { Input }] = await Promise.all([
    import("akanjs/base"),
    import("akanjs/constant"),
    import("akanjs/store"),
    import("akanjs/client/clientRuntime"),
    import("./Input"),
  ]);
  const { store, StoreInstance, StoreRegistry } = storeFacet;
  // `Input` localizes its own validation message through `usePage()`, which needs the generated app client.
  registerClientRuntime({ usePage: () => ({ l: (key: string) => key }) } as never);

  const AttrInput = via((f) => ({ nickname: f(String), age: f(Int, { default: 0 }) }));
  const AttrObject = via(AttrInput, () => ({}));
  const AttrLight = via(AttrObject, ["nickname"] as const, () => ({}));
  const AttrFull = via(AttrObject, AttrLight, () => ({}));
  const AttrInsight = via(AttrFull, (f) => ({ count: f(Int, { default: 0 }) }));
  const cnst = ConstantRegistry.buildModel("attrMember", AttrInput, AttrObject, AttrFull, AttrLight, AttrInsight, {
    AttrInput,
    AttrObject,
    AttrFull,
    AttrLight,
    AttrInsight,
  });

  const signal = stubSignal("attrMember", cnst, {
    prefix: "attrMember",
    cruGuards: ["SignedIn"],
    endpoint: {},
    slice: {},
  });

  class MemberStore extends store(signal, () => ({})) {}
  StoreRegistry.register(MemberStore);
  const st = new StoreInstance(StoreRegistry.merge("attrRoot", MemberStore));

  const render = async (onChange: unknown) =>
    new Response(await renderToReadableStream(createElement(Input, { value: "", onChange } as never))).text();
  html = await render(st.do.setNicknameOnAttrMember);
  plainHtml = await render((value: string) => value);
});

describe("agentAttrs", () => {
  test("a setter passed by reference names itself and the state it writes, with no app code", () => {
    expect(html).toContain('data-akan-action="setNicknameOnAttrMember"');
    expect(html).toContain('data-akan-state="attrMemberForm.nickname"');
  });

  test("an inline closure gets no attributes, because it says nothing about what it does", () => {
    expect(plainHtml).not.toContain("data-akan-action");
  });
});
