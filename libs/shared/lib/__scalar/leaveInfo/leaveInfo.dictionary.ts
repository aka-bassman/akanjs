import { scalarDictionary } from "akanjs/dictionary";

import type { LeaveInfo, LeaveType } from "./leaveInfo.constant";

export const dictionary = scalarDictionary(["en", "ko"])
  .of((t) => t(["Leave Info", "탈퇴 정보"]).desc(["Leave Info", "탈퇴 정보"]))
  .model<LeaveInfo>((t) => ({
    type: t(["Type", "타입"]).desc(["Type", "타입"]),
    reason: t(["Reason", "사유"]).desc(["Reason", "사유"]),
    satisfaction: t(["Satisfaction", "만족도"]).desc(["Satisfaction", "만족도"]),
    voc: t(["VOC", "VOC"]).desc(["VOC", "VOC"]),
    at: t(["At", "일시"]).desc(["At", "일시"]),
  }))
  .enum<LeaveType>("leaveType", (t) => ({
    noReply: t(["No Reply", "답변 없음"]).desc(["No Reply", "답변 없음"]),
    comeback: t(["Comeback", "복귀"]).desc(["Comeback", "복귀"]),
    unsatisfied: t(["Unsatisfied", "불만족"]).desc(["Unsatisfied", "불만족"]),
    other: t(["Other", "기타"]).desc(["Other", "기타"]),
  }))
  .translate({
    leaveChosen: ["You chose to leave.", "탈퇴를 선택하셨습니다."],
    askComeback: ["Would you like to sign up again later?", "탈퇴 후 재가입 의향이 있으신가요?"],
    askLeaveReason: ["What is the main reason you are leaving?", "탈퇴의 가장 큰 이유는 무엇인가요?"],
    askComebackReason: ["Why would you sign up again?", "재가입 의향이 있으신 이유는 무엇인가요?"],
    leaveReasonNoIntent: ["I no longer intend to use the service", "사용해보니 서비스를 사용할 의사가 없어서"],
    leaveReasonOtherService: ["I want to use a similar app instead", "동일한 다른 서비스 앱을 사용하기 위해서"],
    leaveReasonAds: ["Ads and notifications are too much", "광고(푸시, 알림)이 번거로워서"],
    leaveReasonTemporary: [
      "I signed up just for an event or out of curiosity",
      "이벤트, 호기심 등으로 일시적으로 가입했기 때문에",
    ],
    reasonNone: ["None of the above", "보기에 없음"],
    comebackReasonEditInfo: ["I want to change my account information", "가입정보를 수정하기 위해서"],
    comebackReasonLater: ["I want to come back later", "시간이 지나고 다시 사용하기 위해서"],
    askSatisfaction: ["How satisfied were you with the service?", "서비스에 대해 얼마나 만족하셨나요?"],
    satisfactionVerySatisfied: ["Very satisfied", "매우 만족"],
    satisfactionSatisfied: ["Satisfied", "만족"],
    satisfactionNeutral: ["Neutral", "보통"],
    satisfactionUnsatisfied: ["Unsatisfied", "불만족"],
    satisfactionVeryUnsatisfied: ["Very unsatisfied", "매우 불만족"],
    askVoc: ["What should we improve?", "운영진에 바라는 개선사항을 알려주세요."],
    vocPlaceholder: ["Leave any other comments.", "기타 의견을 남겨주세요."],
    leaveConfirm: ["Leave this account?", "탈퇴하시겠습니까?"],
    leaveConfirmPermanent: [
      "Close the account permanently? This cannot be undone.",
      "계정을 영구적으로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    ],
    submitAndLeave: ["Submit and Leave", "제출후 탈퇴하기"],
  });
