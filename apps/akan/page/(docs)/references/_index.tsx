import { page, router } from "akanjs/client";

export default page().render(() => {
  router.redirect("/references/cli/overview");
  return <div>Docs</div>;
});
