# Kubernetes

- Source: /cheatsheet/dev/k8s
- Mirror: /llms/pages/cheatsheet/dev/k8s.md
- Section: cheatsheet
- Category: Development
- Priority: P2

## Headings

- Kubernetes (#overview)
- Architecture (#architecture)
- Values (#values)
- Scale (#scale)
- Open Console (#console)
- Tips (#tips)

## Content

Kubernetes

Runs the app image in exactly one pod.

Exposes the app on port 8282 inside the cluster.

Connects your domains to the Service and gets their TLS certificate.

Keeps the sqlite data in `/workspace/sqlite` across pod restarts.

Defaults for the `debug`, `develop` and `main` branches: replica, resources, storage.

Values every app shares: `repoName`, `serveDomain`, `image.registry`.

The app's own values: `appName`, `subRoutes`, domains, and any override.

The app's own secret values, and it may be empty.

Names the namespace `<appName>-<branch>`, the image path and the default host.

The workspace part of the image path `<registry>/<repoName>/<appName>`.

The base domain, so the default host is `<appName>-<branch>.<serveDomain>`.

Adds one `<subRoute>-<branch>.<serveDomain>` host and TLS name per basePath.

The registry host.

Write it only to pin one specific build.

Extra hosts and TLS names for that branch, such as a production domain.

Becomes `AKAN_REPLICA` in the pod: process counts for federation, batch and all.

unset

Becomes `AKAN_SOLO`; write `false` to keep a gateway in front of a single replica.

The memory and CPU the pod requests.

The pod's limit; the CPU limit also sets how many images the optimizer encodes at once.

The size of the `ReadWriteOnce` PVC mounted at `/workspace/sqlite`.

Serves requests and skips services and internals pinned to `serverMode: "batch"`.

Never listens, and runs scheduled and queued internals, including those pinned to `batch`.

Serves requests and runs every internal.

Requests

batch internals

One process, no gateway

The chart default: one all-purpose process.

One request process, so nothing pinned to batch runs.

Several processes behind a gateway

Two request processes and one batch worker.

Waits up to 2 minutes for boot, since SSR loads its route artifacts before it listens.

Restarts a stuck server after three misses in a row.

Takes the pod out of the Service after two misses in a row.

AKAN_REPLICA In Depth

Every slot and value, and when a gateway appears.

Container Console

What the console offers, its lifecycle, and its safety rules.

Health And Metrics

Read the numbers before you raise requests and limits.

Resource

Name

What it does

The namespace picks the branch

You never write the branch as a value. The chart reads it from the release namespace:

Architecture

A request enters through the Ingress, and the Service passes it to the pod, which keeps its data on the PVC. Alongside, the kubelet checks the pod's health.

Request path

Domain

TLS, one host per subRoute and domain

Values

File

What it holds

Deploy command

An app's values file

A production app that needs more capacity than the defaults writes something like this:

Top-level keys

Per-branch keys

Scale

Role

Common values

Yes

No

Health probes

Period

Timeout

Failures

Open Console

Tips

Related pages

## Code Examples

### Terminal

```bash
helm upgrade app ./app/ -i --create-namespace -n myapp-main \
  -f app/values/_common-values.yaml \
  -f app/values/_common-secret.yaml \
  -f app/values/myapp-values.yaml \
  -f app/values/myapp-secret.yaml
kubectl rollout restart deployments/app-deployment -n myapp-main
```

### infra/app/values/myapp-values.yaml

```yaml
appName: myapp
subRoutes: [admin]

main:
  domains:
    - myapp.example.com
  app:
    replica: "2,1,0"
    resources:
      requests:
        memory: 1G
        cpu: "1"
      limits:
        memory: 4G
        cpu: "4"
      storage: 5Gi
```

### Terminal

```bash
kubectl exec -it -n myapp-main deploy/app-deployment -c app -- \
  sh -lc 'AKAN_CONSOLE=1 bun console.js'
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

