import { LexicalDemo } from "@libs/shared/ui";
import { page } from "akanjs/client";

export default page()
  .config({ devOnly: true })
  .render(() => <LexicalDemo />);
