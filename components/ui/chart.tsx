"use client";

// Minimal shadcn-style chart wrapper around Recharts.
// Provides CSS-variable color theming and a consistent tooltip.

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label: string;
    color?: string;
  }
>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within <ChartContainer>");
  return ctx;
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig;
  children: React.ReactElement;
}) {
  const cssVars = Object.fromEntries(
    Object.entries(config)
      .filter(([, v]) => !!v.color)
      .map(([k, v]) => [`--color-${k}`, v.color as string]),
  );

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart
        className={cn(
          "flex aspect-auto w-full justify-center text-xs",
          "[&_.recharts-cartesian-axis-tick_text]:fill-zinc-500",
          "[&_.recharts-cartesian-grid_line]:stroke-zinc-200",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-zinc-300",
          "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-zinc-200",
          "[&_.recharts-radial-bar-background-sector]:fill-zinc-100",
          "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-zinc-100",
          "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-zinc-200",
          "[&_.recharts-dot[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-layer]:outline-none",
          "[&_.recharts-sector]:outline-none",
          "[&_.recharts-surface]:outline-none",
          className,
        )}
        style={cssVars as React.CSSProperties}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipPayloadItem = {
  name?: string;
  value?: number | string;
  dataKey?: string | number;
  color?: string;
  payload?: Record<string, unknown>;
};

export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel = false,
  formatter,
  labelFormatter,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  hideLabel?: boolean;
  formatter?: (value: number | string, name: string) => React.ReactNode;
  labelFormatter?: (label: string | number) => React.ReactNode;
}) {
  const { config } = useChart();
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md">
      {!hideLabel && label !== undefined && (
        <div className="mb-1 font-medium text-zinc-900">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((item, i) => {
          const key = String(item.dataKey ?? item.name ?? i);
          const cfg = config[key];
          const name = cfg?.label ?? item.name ?? key;
          const color = cfg?.color ?? item.color ?? "#71717a";
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: color }}
              />
              <span className="text-zinc-600">{name}</span>
              <span className="ml-auto font-medium text-zinc-900">
                {formatter
                  ? formatter(item.value as number, String(name))
                  : String(item.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ChartLegend = RechartsPrimitive.Legend;

export function ChartLegendContent({
  payload,
}: {
  payload?: { value?: string; color?: string; dataKey?: string }[];
}) {
  const { config } = useChart();
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
      {payload.map((item, i) => {
        const key = String(item.dataKey ?? item.value ?? i);
        const cfg = config[key];
        return (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: cfg?.color ?? item.color }}
            />
            <span className="text-zinc-600">{cfg?.label ?? item.value}</span>
          </div>
        );
      })}
    </div>
  );
}
