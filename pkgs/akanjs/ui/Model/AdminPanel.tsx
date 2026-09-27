import type { ModelProps } from "akanjs/client";
import type { BaseInsight } from "akanjs/constant";
import type { QuerySetting, SliceMeta } from "akanjs/fetch";
import type { ComponentType, ReactNode } from "react";
import { Data } from "../Data";
import type { ListContainerProps } from "../Data/ListContainer";

interface AdminPanelProps<T extends string, State, Input, Full extends { id: string }, Light extends { id: string }>
  extends ListContainerProps<T, State, Input, Full, Light> {
  slice: SliceMeta;
  /** Generated `<Model>.Unit` / `.Template` / `.View` namespaces. A role without a `General` export is skipped. */
  components: {
    Template: { [key: string]: any };
    Unit: { [key: string]: any };
    View: { [key: string]: any };
  };
  template?: any;
  unit?: any;
  view?: any;
  /** Overrides a summary column's filter; a column left out still filters through its field's `.meta(...)`. */
  queryMap?: { [column: string]: QuerySetting };
  /** Model whose fields `summaryColumns` name. Defaults to the `summary` model the state key already implies. */
  summaryRefName?: string;
  /** Keys of the app's `summary` state shown as dashboard tiles above the list. */
  summaryColumns?: string[];
  /** Model insight keys shown above the list. The header already carries the total count. */
  insightColumns?: string[];
}

export default function AdminPanel<
  RefName extends string,
  State,
  Input,
  Full extends { id: string },
  Light extends { id: string },
>({
  slice,
  components,
  queryMap,
  summaryRefName,
  template,
  unit,
  view,
  summaryColumns,
  insightColumns = [],
  renderInsight = ({ insight }) => (
    <Data.Insight insight={insight} slice={slice} columns={insightColumns as (keyof BaseInsight)[]} />
  ),
  // Defaulted only when columns are asked for, or every app with a `summary` key would get an empty frame.
  renderDashboard = summaryColumns?.length
    ? ({ summary, hidePresents, onSelect, queryKey }) => (
        <Data.Dashboard
          summary={summary}
          slice={slice}
          columns={summaryColumns}
          queryMap={queryMap}
          summaryRefName={summaryRefName}
          onSelect={onSelect}
          queryKey={queryKey}
          hidePresents={hidePresents}
        />
      )
    : undefined,
  ...props
}: AdminPanelProps<RefName, State, Input, Full, Light>) {
  const { sliceName } = slice;
  const Unit = (unit ?? components.Unit.General ?? components.Unit.Card ?? Object.values(components.Unit).at(0)) as
    | ((props: ModelProps<any, any>) => ReactNode)
    | undefined;
  const Template = (template ?? components.Template.General ?? Object.values(components.Template).at(0)) as
    | ((props: { [key in RefName]: Full }) => ReactNode)
    | undefined;
  const View = (view ?? components.View.General ?? Object.values(components.View).at(0)) as
    | ComponentType<{ [key in RefName]: Full }>
    | undefined;
  return (
    <Data.ListContainer
      slice={slice}
      queryMap={queryMap}
      renderItem={Unit}
      renderInsight={renderInsight}
      renderDashboard={renderDashboard}
      renderTemplate={Template}
      renderView={View ? (model) => <View {...({ [sliceName]: model } as { [key in RefName]: Full })} /> : undefined}
      {...props}
    />
  );
}
