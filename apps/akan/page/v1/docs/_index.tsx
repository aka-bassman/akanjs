import { page, router } from "akanjs/client";

export default page()
  .config({ transition: "none" })
  .head(({ lang }) => {
    const title = lang === "ko" ? "Akan.js v1 문서 | Akan.js" : "Akan.js v1 Docs | Akan.js";
    const description =
      lang === "ko"
        ? "v1에 머문 프로젝트를 위해 남겨 둔 Akan.js v1 문서."
        : "The Akan.js v1 documentation, kept online for projects still on v1.";
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
    router.redirect("/v1/docs/intro/quickstart");
    return <div>Docs</div>;
  });
