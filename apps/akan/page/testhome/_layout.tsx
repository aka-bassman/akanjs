import { Flight } from "@apps/akan/ui";
import { layout } from "akanjs/client";

export default layout()
  .loading(() => <Flight.Loader />)
  .render(({ children }) => <Flight.Shell>{children}</Flight.Shell>);
