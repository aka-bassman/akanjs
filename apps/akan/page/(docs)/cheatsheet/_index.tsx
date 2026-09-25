import { page, router } from "akanjs/client";

export default page().render(() => {
  router.redirect("/cheatsheet/general/auth");
  return <div>Docs</div>;
});
