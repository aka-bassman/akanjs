import { page, router } from "akanjs/client";

export default page()
  .config({ transition: "none" })
  .head(({ lang }) => {
    const title = lang === "ko" ? "웹사이트 | Akan.js" : "Websites | Akan.js";
    const description = lang === "ko" ? "Akan.js 홈으로 이동합니다." : "Opens the Akan.js home page.";
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
    router.redirect("/");
    return <div>Websites</div>;
  });
