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

Akan Kubernetes deployment is built around one app container, a Service, an Ingress, and persistent storage for sqlite data.

Deployment runs the app image.

Service exposes the app inside the cluster.

Ingress connects domains to the Service.

PVC keeps sqlite data across pod restarts.

The branch is not a value you set — the chart reads it out of the release namespace, splitting <appName>-<branch> and selecting the values block of that name. Deploying to the wrong namespace silently picks the wrong block.

Architecture

Think of the chart as four connected pieces. Users enter through Ingress, the Service routes traffic to the Pod, and the Pod stores local data through a PVC.

Mental model

The Deployment always carries replicas: 1. Scaling an Akan app is AKAN_REPLICA inside the pod, not more pods — the sqlite PVC is ReadWriteOnce, so a second pod could not mount it.

Values

There is no single values.yaml. The chart is fed four files in order — the shared defaults, the shared secrets, then the app's own two — so an app usually writes nothing but its name and its production domains, and everything else comes from the common file.

The namespace is <appName>-<branch>, the image path segment, and the default ingress host. Everything else is derived from it.

The workspace segment of the image path: <registry>/<repoName>/<appName>.

The base host. The chart serves <appName>-<branch>.<serveDomain> without anything else being declared.

Extra <subRoute>-<branch>.<serveDomain> ingress hosts and TLS SANs, one per basePath the app ships.

The registry host.

Pin a specific build. The default is a moving tag, which is why a deploy also has to restart the rollout.

Custom ingress hosts and TLS SANs for that branch, on top of the derived ones. This is where a production domain goes.

Becomes AKAN_REPLICA inside the pod — federation, batch, all.

Becomes AKAN_SOLO, and only when the key is present. Write false to keep the gateway in front of a single replica.

The pod request. Start conservative and watch metrics before raising it.

The pod limit. The CPU limit is also what the image optimizer sizes its encode pool from, so a tight limit narrows that too.

The PVC size, ReadWriteOnce, mounted at /workspace/sqlite.

The container port, the Service port, replicas: 1, the 40s termination grace period and the three probes are fixed in the template, not values. Changing any of them is a chart edit.

Scale

`app.replica` becomes `AKAN_REPLICA` inside the pod. Use it with CPU and memory values to scale work safely.

`0,0,1`: one all-purpose child, and the chart default. No gateway.

`1,0,0`: one request child and nothing scheduled. Also no gateway.

`2,1,0`: more request capacity plus one batch worker, behind a gateway.

A single request-serving replica (`1,0,0` or `0,0,1`) runs in the pod's only process, with no gateway in front of it. That leaves the kubelet as the only thing that can restart a wedged server, so the chart ships liveness, readiness, and startup probes on /_akan/app/health, which a solo process answers itself.

The startup probe carries the boot at 5-second intervals for up to two minutes, because an SSR replica loads its route artifacts before it listens. The 40-second termination grace period is deliberately longer than the server's own 30-second drain budget, so a SIGKILL never lands the instant that budget expires.

Open Console

Use `kubectl exec` to run the generated `console.js` already embedded in the built app image.

The console starts a separate no-listen server process in the same pod; it does not attach to the running `main.js` memory. Its `.tail` and `.trace` do reach the running server, through the control socket in the runtime directory.

Tips

Start with conservative requests and watch metrics before raising limits.

Resize sqlite storage before it becomes urgent.

Keep domain and subRoute values explicit so Ingress rules stay predictable.

The default image tag is <branch>-live and does not move on its own, so a deploy has to restart the rollout for the pod to pick up a new build.

## Code Examples

### infra/app/values/myapp-values.yaml

```ts
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
kubectl exec -it -n prod pod/myapp-xxxxx -c myapp -- sh -lc 'AKAN_CONSOLE=1 bun console.js'
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.
- Use this page as a task recipe, then verify with the relevant lint, test, or build command.

