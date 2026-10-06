export const dictionary = modelDictionary(["en", "ko"])
  .of((t) => t(["Video Board", "비디오 보드"]).desc(["Cuts name a {{slot}} the user types", "컷에 {{슬롯}}을 적습니다"])) // @ok
  .model((t) => ({
    refAssets: t(["Ref Assets", "참고 자산"]).desc(["Each plays a {{slot}} of the plan", "기획안의 {{슬롯}}을 맡습니다"]), // @ok
  }))
  .endpoint((fn) => ({
    bindSlot: fn(["Bind Slot", "슬롯 연결"]).desc(["Bind an asset to a {{slot}}", "{{슬롯}}에 자산을 연결합니다"]), // @ok
  }))
  .error({
    videoBlockedByPolicy: ["The provider refused this video: {reason}", "제공자가 거절했습니다: {reason}"], // @ok
  })
  .translate({
    greeting: [`Hello {name}`, `안녕하세요 {name}`], // @ok
    bracesExplained: ["Wrap a name in { and }", "이름을 { 와 }로 감쌉니다"], // @ok
  });
