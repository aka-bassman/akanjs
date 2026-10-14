import { page, router } from "akanjs/client";

export default page()
  .config({ transition: "none" })
  .head(({ lang }) => {
    const title = lang === "ko" ? "레퍼런스 | Akan.js" : "Reference | Akan.js";
    const description =
      lang === "ko"
        ? "akanjs 패키지와 CLI, UI 컴포넌트 레퍼런스."
        : "The akanjs package, the CLI and the UI component reference.";
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
    router.redirect("/references/cli/overview");
    return <div>Docs</div>;
  });
