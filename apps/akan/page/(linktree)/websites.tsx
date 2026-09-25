import { page, router } from "akanjs/client";

export default page().render(() => {
  router.redirect("/");
  return <div>Websites</div>;
});
