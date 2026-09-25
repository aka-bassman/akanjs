import { page, router } from "akanjs/client";

export default page().render(() => {
  router.redirect("/docs/intro/quickstart");
  return <div>Docs</div>;
});
