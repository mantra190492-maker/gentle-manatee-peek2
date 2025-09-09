// @ts-nocheck
import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

// Format: { color: string, [`${dataKey}`]: number }
type ChartConfig = {
  container?: React.ComponentProps<typeof ChartContainer>["config"];
  label?: string;
  icon?: React.ComponentType;
} & (
  | {
      color: string;
      variant?: "primary" | "secondary";
    }
  | {
      color?: string;
      variant: "primary" | "secondary";
    }
);

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer>");
  }
  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ config, className, children, ...props }, ref) => {
  const id = React.useId();
  if (!config) {
    return null;
  }
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={id}
        ref={ref}
        className={cn(
          "flex h-[--chart-height] w-full flex-col [&_.recharts-cartesian-grid-vertical]:hidden [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-polar-grid-angle]:hidden [&_.recharts-radial-bar-background]:fill-muted [&_.recharts-tooltip-item]:!text-foreground [&_.recharts-tooltip-wrapper]:outline-none [&_.recharts-xaxis>.recharts-cartesian-axis-tick>line]:stroke-border [&_.recharts-yaxis>.recharts-cartesian-axis-tick>line]:stroke-border [&_path.recharts-curve]:stroke-2 [&_path.recharts-sector]:stroke-transparent [&_path.recharts-sector]:stroke-w-1",
          className
        )}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentPropsWithoutRef<"div"> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: "dot" | "line" | "dashed";
      nameKey?: string;
      labelKey?: string;
    }
>(
  (
    {
      className,
      bodyClassName,
      wrapperClassName,
      contentStyle,
      hideLabel = false,
      hideIndicator = false,
      indicator = "dot",
      nameKey,
      labelKey,
      ...props
    },
    ref
  ) => {
    const { config } = useChart();
    const { active, payload, label } = props;
    if (!active || !payload || payload.length === 0) {
      return null;
    }
    const formattedLabel = labelKey
      ? payload[0]?.payload[labelKey] ?? label
      : label;
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-border bg-background p-2 text-sm shadow-md",
          wrapperClassName
        )}
        style={contentStyle}
      >
        {!hideLabel && formattedLabel && (
          <div className="grid auto-rows-max gap-px pb-1">
            <p className="text-muted-foreground">{formattedLabel}</p>
          </div>
        )}
        <div className={cn("grid gap-px", bodyClassName)}>
          {payload.map((item: any) => {
            const key = nameKey ? item.payload[nameKey] : item.name;
            const chartConfig = config[key];
            return (
              <div
                key={item.dataKey}
                className="flex items-center gap-2 [&>svg]:h-2 [&>svg]:w-2 [&>svg]:rounded-full"
              >
                {chartConfig?.icon && (
                  <chartConfig.icon className="h-3 w-3" />
                )}
                <span className="text-muted-foreground">
                  {chartConfig?.label || item.name}
                </span>
                <span
                  className={cn(
                    "ml-auto font-medium text-foreground",
                    chartConfig?.color
                  )}
                >
                  {item.value}
                </span>
                {!hideIndicator && (
                  <div
                    className={cn(
                      "recharts-tooltip-indicator h-2 w-2 rounded-full",
                      item.color || chartConfig?.color
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Legend> &
    React.ComponentPropsWithoutRef<"div"> & {
      hideIcon?: boolean;
      formatter?: (
        value: string,
        entry: RechartsPrimitive.LegendPayload,
        index: number
      ) => React.ReactNode;
    }
>(({ className, hideIcon = false, formatter, ...props }, ref) => (
  <RechartsPrimitive.DefaultLegendContent
    content={({ payload }) => {
      if (!payload || payload.length === 0) {
        return null;
      }
      return (
        <ul
          ref={ref}
          className={cn(
            "flex flex-wrap items-center justify-center gap-4",
            className
          )}
        >
          {payload.map((item: any) => {
            const { value, payload } = item;
            const chartConfig = props.config?.[value];
            return (
              <li
                key={value}
                className={cn(
                  "flex items-center gap-1 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:rounded-full",
                  chartConfig?.color
                )}
              >
                {chartConfig?.icon && (
                  <chartConfig.icon />
                )}
                {hideIcon ? null : (
                  <div
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      item.color || chartConfig?.color
                    )}
                  />
                )}
                {formatter ? (
                  formatter(value, item, 0)
                ) : (
                  <span className="text-muted-foreground">
                    {chartConfig?.label || value}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      );
    }}
    {...props}
  />
));
ChartLegendContent.displayName = "ChartLegendContent";

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
};