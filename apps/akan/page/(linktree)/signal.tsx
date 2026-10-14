import { SampleSignal } from "@apps/akan/ui";
import { page } from "akanjs/client";

export default page()
  .config({ transition: "none" })
  .head(({ lang }) => {
    const title = lang === "ko" ? "샘플 시그널 | Akan.js" : "Sample Signal | Akan.js";
    const description =
      lang === "ko"
        ? "엔드포인트와 그 앞의 가드를 보여 주는 샘플 시그널 화면."
        : "A sample signal view showing endpoints and the guards in front of them.";
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
      <SampleSignal />
    </div>
  ));
