import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/types";
import { format } from "date-fns";

export function RecentTasks({ tasks, dueToday }: { tasks: Task[], dueToday: Task[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming & Recent</CardTitle>
        <CardDescription>Tasks due today and recently created.</CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 && dueToday.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks to show.</p>
        ) : (
          <div className="space-y-4">
            {dueToday.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-accent-foreground">Due Today</h3>
                <div className="space-y-2">
                  {dueToday.map((task) => (
                    <div key={task.id} className="flex items-center justify-between">
                      <p className="font-medium">{task.title}</p>
                      <Badge variant="destructive">Today</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
             {tasks.length > 0 && (
              <div>
                 <h3 className="mb-2 text-sm font-semibold">Recent Tasks</h3>
                  <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(task.createdAt.toDate(), 'MMM d')}
                      </p>
                    </div>
                  ))}
                  </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
