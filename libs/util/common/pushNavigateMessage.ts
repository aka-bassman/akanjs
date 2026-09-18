//* 서비스워커가 알림 클릭을 이미 열려 있는 탭으로 넘길 때 쓰는 postMessage 타입.
//* 생성기(plugin/firebaseMessagingSw)와 수신부(webkit/usePushNotification)가 같은 문자열을 써야 하고,
//* 어긋나면 클릭이 조용히 아무 일도 하지 않으므로 상수로 묶는다.
export const pushNavigateMessage = "akan-push-navigate";
