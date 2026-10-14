import { page, router } from "akanjs/client";

export default page()
  .config({ transition: "none" })
  .head(({ lang }) => {
    const title = lang === "ko" ? "치트시트 | Akan.js" : "Cheatsheet | Akan.js";
    const description =
      lang === "ko"
        ? "Akan.js에서 자주 하는 작업을 짧게 정리한 레시피 모음."
        : "Short, task-first recipes for everyday Akan.js work.";
    return (
      <>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </>
    );
  })
  .render(() => {
    router.redirect("/cheatsheet/general/auth");
    return <div>Docs</div>;
  });
