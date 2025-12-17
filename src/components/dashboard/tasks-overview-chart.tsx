"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import type { Task } from "@/lib/types";

const chartConfig = {
  todo: { label: "To-do", color: "hsl(var(--chart-1))" },
  "in-progress": { label: "In Progress", color: "hsl(var(--chart-2))" },
  done: { label: "Done", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

export function TasksOverviewChart({ tasks }: { tasks: Task[] }) {
  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const chartData = Object.keys(chartConfig).map((key) => ({
    name: chartConfig[key as keyof typeof chartConfig].label,
    value: statusCounts[key] || 0,
    fill: chartConfig[key as keyof typeof chartConfig].color,
  }));

  const totalTasks = tasks.length;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Tasks Overview</CardTitle>
        <CardDescription>A summary of your task statuses.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          {totalTasks > 0 ? (
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No tasks to display
            </div>
          )}
        </ChartContainer>
      </CardContent>
      <CardContent className="flex-1 pt-4">
        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
          {Object.entries(chartConfig).map(([key, config]) => (
            <div key={key} className="flex items-center">
              <span
                className="mr-2 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: config.color }}
              ></span>
              {config.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
