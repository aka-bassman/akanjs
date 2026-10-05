import { Flight } from "@apps/akan/ui";
import { page } from "akanjs/client";

export default page()
  .head(
    <>
      <title>Akan.js — AK-3 Flight Manual</title>
      <meta name="description" content="The TypeScript framework, agents included — built around one line." />
      <meta name="robots" content="noindex" />
      <meta name="theme-color" content="#0c1c35" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
    </>,
  )
  .render(() => (
    <main className="relative">
      <Flight.Assembly />
      <div className="relative">
        <div className="flt-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black_88%,transparent)]" />
        <Flight.Avionics />
        <Flight.SheetRule sheet="07" />
        <Flight.Tower />
        <Flight.SheetRule sheet="08" />
        <Flight.ControlLaws />
        <Flight.SheetRule sheet="09" />
        <Flight.Preflight />
        <Flight.SheetRule sheet="10" />
        <Flight.FlightTest />
      </div>
      <div className="flt-to-dusk h-[36svh]" />
      <Flight.Takeoff />
      <Flight.Comms />
      <Flight.Cruise />
    </main>
  ));
