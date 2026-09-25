# Show Details

- Source: /docs/tutorials/view
- Mirror: /llms/pages/docs/tutorials/view.md
- Section: docs
- Category: Tutorials
- Priority: P1

## Headings

- Show Details (#show-details)
- Add View/Edit Modal (#view-wrapper)
- Add View Button to Unit Cards (#button-on-unit)
- Design Detail View (#design-detail-view)
- Test Your Implementation (#test-implementation)
- What's Next? (#next-steps)

## Content

Show Details

A Unit card renders the light model: just enough to tell orders apart. A detailed view is what opens when a customer taps one — the exact size, every topping, the order time, and whether it is ready.

In Akan.js, three components work together to build a detailed view:

A clickable wrapper that triggers the view modal when clicked. Think of it as the "View Details" button functionality.

A modal popup that displays when customers want to see details. It handles opening, closing, and data loading automatically.

The actual content inside the modal, showing all the order information in an organized layout.

This separation allows each component to have a single responsibility: the wrapper handles clicking, the modal handles the popup behavior, and the view handles the display formatting.

Add View/Edit Modal

Now let's add a View/Edit modal to our ice cream order page. This creates a popup window where customers can see all their order details in an organized format. The modal functions like a detailed receipt that appears when customers want to review their order information.

This code creates a modal system that handles the display and editing of orders. Let's examine what each part does:

Load.Units Component

Renders every order as a Unit card in a list, each showing basic order information

Model.ViewEditModal

Creates the modal popup that appears when customers click to view details. It automatically loads order data and displays it in a structured format

The ViewEditModal component handles opening, closing, data loading, and content display automatically. You specify what content to show, and it manages the technical implementation. This approach allows you to add detailed views throughout your application with minimal code.

Add View Button to Unit Cards

Now let's add a "View" button to each order's Unit card. This button provides a clear interface element that customers can click to access detailed order information. The button will be positioned and styled to integrate with the existing Unit card design.

The key addition here is the ViewWrapper around the button:

This wraps our button and handles the click functionality to show the detailed view

We pass the slice and modelId so the modal knows which order to display details for

The button uses the buttonRecipe primary variant and lg size for consistent styling across the app

Design Detail View

Now let's create the detailed view component in View.tsx that displays all the ice cream order information in a structured layout. This component will organize and present the order data in a readable format when the modal opens.

This detailed view component creates a comprehensive display of the ice cream order:

Header Section

Shows an ice cream emoji, the order title from dictionary, and the order ID number for reference

Grid Layout

Uses a 2-column grid to organize field labels and values in a clean, scannable format

Visual Elements

Toppings display as colored badges, status shows with conditional styling, and timestamps are formatted for readability

Test Your Implementation

Let's test the detailed view implementation. Navigate to your ice cream order page and click the "View" button on any Unit card to verify that the system works correctly.

Testing Steps:

Navigate to http://localhost:8282/icecreamOrder

Create a new ice cream order if you don't have any

Click the 'View' button on any Unit card

Verify the modal opens with detailed order information

Check that all fields display correctly with proper translations

A modal popup should appear displaying all order details: size, toppings (as colored badges), status (with conditional colors), and timestamps. The modal closes when you click outside it or press the X button.

What's Next?

In the next tutorial, we'll add status management functionality that allows shop staff to update orders from "active" to "processing" to "served". This will complete the order workflow system and provide full lifecycle management for ice cream orders.

## Code Examples

### apps/koyo/lib/icecreamOrder/IcecreamOrder.Zone.tsx

```ts
"use client"; // [!code collapse:3]
import type { ClientInit, ClientView, SliceMeta } from "akanjs/fetch";
import { cnst, fetch, IcecreamOrder } from "@apps/koyo/client";
import { DefaultOf } from "akanjs/constant";
import { Load, Model } from "akanjs/ui";

interface CardProps {
  className?: string;
  init: ClientInit<"icecreamOrder", cnst.LightIcecreamOrder>;
  slice?: SliceMeta;
}
export const Card = ({ className, init, slice = fetch.slice.icecreamOrder }: CardProps) => {
  return (
    <>
      <Load.Units
        className={className}
        init={init}
        renderItem={(icecreamOrder: cnst.LightIcecreamOrder) => (
          <IcecreamOrder.Unit.Card key={icecreamOrder.id} icecreamOrder={icecreamOrder} />
        )}
      />
      <Model.ViewEditModal
        slice={slice}
        renderTitle={(icecreamOrder: DefaultOf<cnst.IcecreamOrder>) =>
          `IcecreamOrder - ${icecreamOrder.id ? icecreamOrder.id : "New"}`
        }
        renderView={(icecreamOrder: cnst.IcecreamOrder) => (
          <IcecreamOrder.View.General className="w-full" icecreamOrder={icecreamOrder} />
        )}
        renderTemplate={() => <IcecreamOrder.Template.General />}
      />
    </>
  );
};

interface ViewProps { // [!code collapse:12]
  className?: string;
  view: ClientView<"icecreamOrder", cnst.IcecreamOrder>;
}
export const View = ({ view }: ViewProps) => {
  return (
    <Load.View
      view={view}
      renderView={(icecreamOrder) => <IcecreamOrder.View.General icecreamOrder={icecreamOrder} />}
    />
  );
};
```

### apps/koyo/lib/icecreamOrder/IcecreamOrder.Unit.tsx

```ts
import { cn, type ModelProps } from "akanjs/client"; // [!code collapse:2]
import { cnst, fetch, usePage } from "@apps/koyo/client";
import { Model, buttonRecipe } from "akanjs/ui"; // [!code ++]

export const Card = ({ icecreamOrder }: ModelProps<"icecreamOrder", cnst.LightIcecreamOrder>) => {
  const { l } = usePage();
  return (
    <div className="group flex w-full flex-wrap justify-between gap-2 overflow-hidden rounded-xl bg-linear-to-br from-background via-muted to-border px-8 py-6 shadow-md transition-all duration-300 hover:shadow-xl">
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
          <span className="inline-block rounded bg-muted px-2 py-1 text-xs font-bold tracking-wider uppercase">
            {l("icecreamOrder.id")}
          </span>
          <span className="ml-2 font-mono text-primary">#{icecreamOrder.id.slice(-4)}</span> // [!code ++]
        </div>
        <div className="mt-4 flex items-center gap-2"> // [!code collapse:17]
          <span className="inline-block rounded border border-border bg-background px-2 py-1 text-xs font-bold tracking-wider text-primary uppercase">
            {l("icecreamOrder.status")}
          </span>
          <span
            className={cn(
              "ml-2 rounded-full px-3 py-1 text-sm font-semibold",
              icecreamOrder.status === "active" && "border border-primary/40 bg-background text-primary",
              icecreamOrder.status === "processing" && "border border-warning/40 bg-background text-warning",
              icecreamOrder.status === "served" && "border border-info/40 bg-info text-info-foreground",
              icecreamOrder.status === "finished" && "border border-accent/40 bg-background text-accent",
              icecreamOrder.status === "canceled" && "border border-border bg-background text-foreground/70",
            )}
          >
            {l(`icecreamOrderStatus.${icecreamOrder.status}`)}
          </span>
        </div>
      </div>
      <div className="bg-background flex items-center justify-center gap-2 rounded-xl p-4"> // [!code ++:7]
        <Model.ViewWrapper slice={fetch.slice.icecreamOrder} modelId={icecreamOrder.id}>
          <button className={buttonRecipe({ variant: "primary" })}>
            <span>{l.trans({ en: "View", ko: "보기" })}</span>
          </button>
        </Model.ViewWrapper>
      </div>
    </div>
  );
};
```

### apps/koyo/lib/icecreamOrder/IcecreamOrder.View.tsx

```ts
import { cn } from "akanjs/client"; // [!code collapse:8]
import { cnst, usePage } from "@apps/koyo/client";

interface GeneralProps {
  className?: string;
  icecreamOrder: cnst.IcecreamOrder;
}

export const General = ({ className, icecreamOrder }: GeneralProps) => {
  const { l } = usePage();
  return (
    <div className={cn(className, "mx-auto w-full space-y-6 rounded-xl p-8 shadow-lg")}>
      <div className="flex items-center gap-3 border-b pb-4">
        <span className="text-3xl font-extrabold text-primary">🍦</span>
        <span className="text-2xl font-bold">{l("icecreamOrder.modelName")}</span>
        <span className="ml-auto text-xs text-foreground/50">#{icecreamOrder.id}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div className="font-semibold text-foreground/50">{l("icecreamOrder.size")}</div>
        <div>{icecreamOrder.size} cc</div>
        <div className="font-semibold text-foreground/50">{l("icecreamOrder.toppings")}</div>
        <div className="flex flex-wrap gap-2">
          {icecreamOrder.toppings.length === 0 ? (
            <span className="italic text-foreground/70">
              {l.trans({ en: "No toppings", ko: "토핑 없음" })}
            </span>
          ) : (
            icecreamOrder.toppings.map((topping) => (
              <span
                key={topping}
                className="inline-block rounded-full bg-background px-2 py-1 text-xs font-medium text-primary"
              >
                {l(`topping.${topping}`)}
              </span>
            ))
          )}
        </div>
        <div className="font-semibold text-foreground/50">{l("icecreamOrder.status")}</div>
        <div>
          <span
            className={cn(
              "inline-block rounded-full px-2 py-1 text-xs font-semibold",
              icecreamOrder.status === "active" && "border border-primary/40 bg-background text-primary",
              icecreamOrder.status === "processing" && "border border-warning/40 bg-background text-warning",
              icecreamOrder.status === "served" && "border border-info/40 bg-info text-info-foreground",
              icecreamOrder.status === "finished" && "border border-accent/40 bg-background text-accent",
              icecreamOrder.status === "canceled" && "border border-border bg-background text-foreground/70",
            )}
          >
            {l(`icecreamOrderStatus.${icecreamOrder.status}`)}
          </span>
        </div>
        <div className="font-semibold text-foreground/50">{l("icecreamOrder.createdAt")}</div>
        <div className="text-foreground/70">{icecreamOrder.createdAt.format("YYYY-MM-DD HH:mm:ss")}</div>
        <div className="font-semibold text-foreground/50">{l("icecreamOrder.updatedAt")}</div>
        <div className="text-foreground/70">{icecreamOrder.updatedAt.format("YYYY-MM-DD HH:mm:ss")}</div>
      </div>
    </div>
  );
};
```

## Agent Notes

- Prefer the linked source docs for human-facing UI details and this Markdown mirror for agent context.

