export const dictionary = modelDictionary(["en", "ko"])
  .of((t) => t(["Video Board", "비디오 보드"]).desc(["A board of cuts", "컷 보드"]))
  .error({
    videoBlockedByPolicy: ["The provider refused this video: {{reason}}", "제공자가 거절했습니다: {{reason}}"], // @flag
    invalidValues: [
      "The device rejects these values: {{fields}} ({{command}}).", // @flag
      "기기가 받지 않는 값입니다: {{fields}} ({{command}}).", // @flag
    ],
  })
  .translate({
    greeting: [`Hello {{name}}`, `안녕하세요 {{name}}`], // @flag
    turnSteps: [`Turn ${"left"} in {{steps}} steps`, "{{steps}}걸음 뒤 회전"], // @flag
  });
