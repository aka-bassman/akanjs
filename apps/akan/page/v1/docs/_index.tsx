import { page, router } from "akanjs/client";

export default page().render(() => {
  router.redirect("/v1/docs/intro/quickstart");
  return <div>Docs</div>;
});
