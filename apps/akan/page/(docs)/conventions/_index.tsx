import { page, router } from "akanjs/client";

export default page()
  .config({ transition: "none" })
  .head(({ lang }) => {
    const title = lang === "ko" ? "규칙 | Akan.js" : "Conventions | Akan.js";
    const description =
      lang === "ko"
        ? "Akan 워크스페이스를 이루는 폴더와 파일, 역할 규칙."
        : "The folder, file and role conventions an Akan workspace is built from.";
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
    router.redirect("/conventions/workspace/structure");
    return <div>Docs</div>;
  });
