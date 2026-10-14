import { SampleSchema } from "@apps/akan/ui";
import { page } from "akanjs/client";

export default page()
  .config({ transition: "none" })
  .head(({ lang }) => {
    const title = lang === "ko" ? "샘플 스키마 | Akan.js" : "Sample Schema | Akan.js";
    const description =
      lang === "ko"
        ? "모델에 선언한 정의에서 그려지는 샘플 스키마 화면."
        : "A sample schema view rendered from a model's declared definition.";
    return (
      <>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </>
    );
  })
  .render(() => (
    <div className="p-8">
      <SampleSchema />
    </div>
  ));
