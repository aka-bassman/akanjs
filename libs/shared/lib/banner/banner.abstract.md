# banner Abstract
카테고리별로 노출할 배너와 연결 링크를 관리한다.

## Rules
- 공개 조회는 카테고리 기준으로 제공한다.
- 배너 생성, 수정, 삭제는 관리자 권한에서 수행한다.
- 배너 이미지는 shared file 문서를 참조한다.
- MCP 에 노출하는 것은 Public 조회뿐이다. 관리자 권한 엔드포인트와 모델 전체 목록은 노출하지 않는다.
- 노출하는 slice 는 자기 guards 를 직접 적는다. slice() 의 guards 맵은 root slice 와 base CRUD 까지만 닿고 named slice 에는 닿지 않아, 적지 않으면 가드 없는 읽기가 된다.
- 그 결과 카탈로그는 banner · lightBanner · bannerListInPublic · bannerInsightInPublic 네 항목이다. slice 하나를 노출하면 목록과 집계가 함께 나가며, 둘을 나눌 스위치는 없다.
