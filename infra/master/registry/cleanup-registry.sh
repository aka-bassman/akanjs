#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../jenkins/credentials.sh"
#add --insecure to the curl command on line 17 if you use https with self-signed certificates

if [ -z "${REGISTRY_DIR:-}" ]; then
	echo "REGISTRY_DIR is not set. Refusing to scan the current directory." >&2
	exit 1
fi

if [ ! -d "${REGISTRY_DIR}" ]; then
	echo "REGISTRY_DIR does not exist: ${REGISTRY_DIR}" >&2
	exit 1
fi

cd "${REGISTRY_DIR}"
count=0

manifests_without_tags=$(comm -23 <(find . -type f -path "*/_manifests/revisions/sha256/*/link" ! -path "*/signatures/sha256/*" | awk -F/ '{print $(NF-1)}' | sort) <(find . -type f -path "*/_manifests/tags/*/current/link" -exec sed 's/^sha256://g' {} \; | sort))

total_count=$(echo "${manifests_without_tags}" | wc -w)

for manifest in ${manifests_without_tags}; do
	repo=$(find . -type f -path "*/_manifests/revisions/sha256/${manifest}/link" | awk -F "_manifest"  '{print $(NF-1)}' | sed 's#^./\(.*\)/#\1#')
	
	#should have error checking on the curl command, it might fail silently atm.
	curl -s -X DELETE ${REGISTRY_URL}/v2/${repo}/manifests/sha256:${manifest} > /dev/null
	
	((count++))
	echo "Deleted ${count} of ${total_count} manifests."
done