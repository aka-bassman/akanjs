---
"akanjs": patch
---

fix(server): a client-side navigation on a sub-route host stays inside that host's basePath

On a host mapped to a basePath (`subRoutes` or `AKAN_SUB_ROUTE_HOSTS`), a page load rewrites every path into that
basePath, so a path only another basePath serves is a 404 there. A client-side navigation (`<Link>`,
`router.push`) also tried the other basePaths and rendered their pages under the mapped host's domain: on the
`soft` host, `/en/admin` and `/en/office/admin` both showed `office`'s admin page. The navigation now resolves its
target exactly as a page load on that host does, so the two answer the same page, or both a 404. A host with no
basePath of its own (a debug host, `akan start` on localhost) still finds the basePath whose route matches.
