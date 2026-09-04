import { describe, expect, it } from "bun:test";
import { extractTextFromContent, extractTextWithoutMentions } from "./extractTextFromContent";

const mention = (label: string) => ({
  type: "akan-mention",
  text: `@${label}`,
  refName: "videoObj",
  refId: "6a950544d6109ed679667ac9",
  label,
  version: 1,
});
const text = (value: string) => ({ type: "text", text: value, version: 1 });
const doc = (children: object[]) => ({
  root: { type: "root", version: 1, children: [{ type: "paragraph", version: 1, children }] },
});

describe("extractTextWithoutMentions", () => {
  it("멘션 글자를 뺀다 — 나머지 문장은 그대로다", () => {
    const content = doc([text("먼지 입자가 빛에 반짝인다."), mention("신제품 운동화")]);
    expect(extractTextWithoutMentions(content).trim()).toBe("먼지 입자가 빛에 반짝인다.");
  });

  it("문장 가운데 있어도 그 자리만 빠진다", () => {
    const content = doc([text("바닥의 "), mention("운동화"), text(" 클로즈업.")]);
    expect(extractTextWithoutMentions(content).trim()).toBe("바닥의  클로즈업.");
  });

  it("멘션이 없으면 원래 것과 같다", () => {
    const content = doc([text("스포트라이트가 내리쬔다.")]);
    expect(extractTextWithoutMentions(content)).toBe(extractTextFromContent(content));
  });

  /* 사람이 읽는 자리(미리보기·검색)는 누가 불렸는지 보이는 편이 낫다 — 그쪽은 안 바뀌어야 한다. */
  it("원래 함수는 멘션을 그대로 둔다", () => {
    const content = doc([text("바닥의 "), mention("운동화")]);
    expect(extractTextFromContent(content).trim()).toBe("바닥의 @운동화");
  });

  it("빈 값·이상한 값에도 안 터진다", () => {
    expect(extractTextWithoutMentions(null)).toBe("");
    expect(extractTextWithoutMentions([])).toBe("");
    expect(extractTextWithoutMentions("문자열")).toBe("");
  });
});
