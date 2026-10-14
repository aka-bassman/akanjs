import { ModalTests } from "@apps/akan/ui";
import { page } from "akanjs/client";

export default page()
  .config({ transition: "none" })
  .head(({ lang }) => {
    const title = lang === "ko" ? "모달 테스트 | Akan.js" : "Modal Tests | Akan.js";
    const description =
      lang === "ko"
        ? "프레임워크의 모달과 다이얼로그 변형을 확인하는 개발용 페이지."
        : "A development page that exercises the framework's modal and dialog variants.";
    return (
      <>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </>
    );
  })
  .render(() => <ModalTests />);
