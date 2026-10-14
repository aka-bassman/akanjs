import { page, router } from "akanjs/client";

export default page()
  .config({ transition: "none" })
  .head(({ lang }) => {
    const title = lang === "ko" ? "문서 | Akan.js" : "Docs | Akan.js";
    const description =
      lang === "ko"
        ? "Akan.js 문서: 개념과 튜토리얼, 프레임워크 레퍼런스 전체."
        : "The Akan.js documentation: concepts, tutorials and the full framework reference.";
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
    router.redirect("/docs/intro/quickstart");
    return <div>Docs</div>;
  });
