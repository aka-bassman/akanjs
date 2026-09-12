import { LayoutDefinition } from "./LayoutDefinition";
import { PageDefinition } from "./PageDefinition";
import { RootLayoutDefinition } from "./RootLayoutDefinition";

/** `export default page().param(…).search(…).config(…).prompt(…).render(async (args) => …)` in a route page file. */
export const page = () => new PageDefinition();
/** `export default layout().render(({ children }) => …)` in a `_layout.tsx`. */
export const layout = () => new LayoutDefinition();
/** The app's (or a basePath's) root `_layout.tsx`: `layout()` plus fonts, manifest, theme and the socket switches. */
export const rootLayout = () => new RootLayoutDefinition();
