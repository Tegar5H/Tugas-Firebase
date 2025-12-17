"use client";

import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import type { Task } from "@/lib/types";
import { getTasks, getDashboardTasks } from "@/lib/actions";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TasksOverviewChart } from "@/components/dashboard/tasks-overview-chart";
import { RecentTasks } from "@/components/dashboard/recent-tasks";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dashboardTasks, setDashboardTasks] = useState<{recent: Task[], dueToday: Task[]}>({recent: [], dueToday: []});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchTasks = async () => {
        setLoading(true);
        const allTasks = await getTasks(user.uid);
        const dashTasks = await getDashboardTasks(user.uid);
        setTasks(allTasks);
        setDashboardTasks(dashTasks);
        setLoading(false);
      };
      fetchTasks();
    }
  }, [user]);

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <div className="col-span-1 lg:col-span-4">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <div className="grid gap-4 md:grid-cols-2 col-span-full">
              <StatsCards tasks={tasks} />
            </div>
            <TasksOverviewChart tasks={tasks} />
            <RecentTasks tasks={dashboardTasks.recent} dueToday={dashboardTasks.dueToday} />
        </div>
      )}
    </div>
  );
}


function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
      <div className="grid gap-4 md:grid-cols-2 col-span-full">
        <Skeleton className="h-[125px]"/>
        <Skeleton className="h-[125px]"/>
        <Skeleton className="h-[125px] lg:col-start-3"/>
      </div>
        <Skeleton className="h-[350px]" />
        <Skeleton className="h-[350px]" />
    </div>
  )
}