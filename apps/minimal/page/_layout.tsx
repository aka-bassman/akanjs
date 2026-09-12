import "./styles.css";
import { rootLayout } from "akanjs/client";

export default rootLayout()
  .fonts([
    {
      name: "notosans",
      default: true,
      paths: [{ src: "/libs/shared/fonts/NotoSansKR.ttf", weight: 500 }],
    },
  ])
  .theme("dark")
  .head(<title>apptest</title>)
  .render(({ children }) => <>{children}</>);
