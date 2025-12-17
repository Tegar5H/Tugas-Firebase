import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ListTodo, Loader } from "lucide-react";
import type { Task } from "@/lib/types";

export function StatsCards({ tasks }: { tasks: Task[] }) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const pendingTasks = totalTasks - completedTasks;

  const stats = [
    { title: "Total Tasks", value: totalTasks, icon: ListTodo },
    { title: "Completed", value: completedTasks, icon: CheckCircle },
    { title: "Pending", value: pendingTasks, icon: Loader },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
