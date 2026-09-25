#!/bin/bash
SECRET_MAP=( \
"apps/akan/env/env.server.local.ts,bunkan-akan-server-env-local,local" \
"apps/akan/env/env.server.testing.ts,bunkan-akan-server-env-testing,testing" \
"apps/akan/env/env.server.debug.ts,bunkan-akan-server-env-debug,debug" \
"apps/akan/env/env.server.develop.ts,bunkan-akan-server-env-develop,develop" \
"apps/akan/env/env.server.main.ts,bunkan-akan-server-env-main,main" \
"apps/akan/env/env.client.local.ts,bunkan-akan-client-env-local,local" \
"apps/akan/env/env.client.testing.ts,bunkan-akan-client-env-testing,testing" \
"apps/akan/env/env.client.debug.ts,bunkan-akan-client-env-debug,debug" \
"apps/akan/env/env.client.develop.ts,bunkan-akan-client-env-develop,develop" \
"apps/akan/env/env.client.main.ts,bunkan-akan-client-env-main,main" \
"libs/shared/env/env.server.testing.ts,bunkan-shared-server-env-testing,testing" \
"libs/util/env/env.server.testing.ts,bunkan-util-server-env-testing,testing" \
)

for SECRET in ${SECRET_MAP[@]}; do
    echo ${SECRET}
done
exit 0