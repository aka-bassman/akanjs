# summary Abstract
여러 도메인의 집계값을 active 문서와 시간별 archive로 유지한다.

## Rules
- active summary는 하나만 유지하고 중복 active 문서는 제거한다.
- periodic archive는 현재 시간의 period type과 at 기준으로 갱신한다.
- 집계 필드는 getQueryMeta로 셀 모델과 쿼리를 선언하고, 그 쿼리로 직접 count하거나 증감/이동 연산으로 갱신한다.
- 필드가 많아지므로 archive는 필드별 update가 아니라 문서 전체를 다시 쓴다.
- public 조회는 active summary만 캐시해 제공한다.

## Workflow
- batch cron이 주기적으로 summarize 결과를 archive한다.
- admin은 recountSummary로 지금 즉시 다시 집계할 수 있다.
