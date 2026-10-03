#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../jenkins/credentials.sh"
#add --insecure to the curl command on line 17 if you use https with self-signed certificates

# Apply defaults only when credentials.sh did not provide them.
: "${REGISTRY_DIR:=$HOME/registry/data/docker/registry/v2/repositories}"
: "${REGISTRY_URL:=http://localhost:5000}"
REGISTRY_URL="${REGISTRY_URL%/}"

if [ -z "${REGISTRY_DIR:-}" ]; then
	echo "REGISTRY_DIR is not set. Refusing to scan the current directory." >&2
	exit 1
fi

if [ ! -d "${REGISTRY_DIR}" ]; then
	echo "REGISTRY_DIR does not exist, nothing to clean: ${REGISTRY_DIR}"
	exit 0
fi

# The registry requires a login. Use REGISTRY_USER/REGISTRY_PASSWORD from credentials.sh when set, otherwise the
# pull secret Jenkins copies to infra/master/regcred.yaml in "Prepare Master" (a .dockerconfigjson of this registry).
REGCRED_PATH="${SCRIPT_DIR}/../regcred.yaml"
registry_auth=""
if [ -n "${REGISTRY_USER:-}" ] && [ -n "${REGISTRY_PASSWORD:-}" ]; then
	registry_auth="$(printf '%s:%s' "${REGISTRY_USER}" "${REGISTRY_PASSWORD}" | base64 | tr -d '\n')"
elif [ -f "${REGCRED_PATH}" ]; then
	dockerconfigjson="$(sed -n 's/^[[:space:]]*\.dockerconfigjson:[[:space:]]*//p' "${REGCRED_PATH}" | head -n 1)"
	if [ -n "${dockerconfigjson}" ]; then
		registry_auth="$(printf '%s' "${dockerconfigjson}" | base64 -d | sed -n 's/.*"auth"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)"
	fi
fi
curl_auth=()
if [ -n "${registry_auth}" ]; then
	curl_auth=(-H "Authorization: Basic ${registry_auth}")
else
	echo "No registry credentials: set REGISTRY_USER/REGISTRY_PASSWORD in credentials.sh or provide ${REGCRED_PATH}." >&2
fi

cd "${REGISTRY_DIR}"
count=0

manifests_without_tags=$(comm -23 <(find . -type f -path "*/_manifests/revisions/sha256/*/link" ! -path "*/signatures/sha256/*" | awk -F/ '{print $(NF-1)}' | sort) <(find . -type f -path "*/_manifests/tags/*/current/link" -exec sed 's/^sha256://g' {} \; | sort))

total_count=$(echo "${manifests_without_tags}" | wc -w)

for manifest in ${manifests_without_tags}; do
	repo=$(find . -type f -path "*/_manifests/revisions/sha256/${manifest}/link" | awk -F "_manifest"  '{print $(NF-1)}' | sed 's#^./\(.*\)/#\1#')

	delete_status="$(curl -s -o /dev/null -w "%{http_code}" ${curl_auth[@]+"${curl_auth[@]}"} -X DELETE "${REGISTRY_URL}/v2/${repo}/manifests/sha256:${manifest}")" || delete_status="000"

	case "${delete_status}" in
		2*)
			;;
		000|401|403|405)
			echo "Registry refused delete request for ${repo}@sha256:${manifest} with HTTP ${delete_status}. Check registry connectivity, login credentials, delete permissions, and delete-enabled config." >&2
			exit 1
			;;
		*)
			echo "Failed to delete ${repo}@sha256:${manifest} with HTTP ${delete_status}, skipping." >&2
			continue
			;;
	esac

	count=$((count + 1))
	echo "Deleted ${count} of ${total_count} manifests."
done