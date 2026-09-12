import { SampleSignal } from "@apps/akan/ui";
import { page } from "akanjs/client";

export default page().render(() => (
  <div className="p-8">
    <SampleSignal />
  </div>
));
