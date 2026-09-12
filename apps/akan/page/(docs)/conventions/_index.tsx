import { page, router } from "akanjs/client";

export default page().render(() => {
  router.redirect("/conventions/workspace/structure");
  return <div>Docs</div>;
});
