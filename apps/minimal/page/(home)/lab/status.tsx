import { LabStatus } from "@apps/minimal/ui";
import { page } from "akanjs/client";

export default page()
  .config({ topInset: 48, transition: "stack" })
  .render(() => <LabStatus />);
