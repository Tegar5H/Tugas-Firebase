import { getTasks, getDashboardTasks } from "@/lib/actions";
import { auth } from "@/lib/firebase";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TasksOverviewChart } from "@/components/dashboard/tasks-overview-chart";
import { RecentTasks } from "@/components/dashboard/recent-tasks";

export default async function DashboardPage() {
  // On the server, auth.currentUser is not available. 
  // For a production app, you'd use a session cookie or server-side auth library.
  // We are simulating this by assuming the layout's client-side guard has run.
  // In a real app, you would get the userId from a server-side session.
  // Since we don't have that, we'll fetch on the client in the components for now.
  // Let's modify components to fetch their own data.
  // This is a common pattern for Firebase + Next.js App router without a dedicated server-side auth library.

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <div className="col-span-1 lg:col-span-4">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="lg:col-span-4">
           {/* The data fetching will be handled inside the components */}
        </div>
        <div className="lg:col-span-4">
          <ClientDashboard />
        </div>
      </div>
    </div>
  );
}


// A new client component to handle data fetching
"use client";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import type { Task } from "@/lib/types";
import { getTasks, getDashboardTasks } from "@/lib/actions";
import { Skeleton } from "@/components/ui/skeleton";

function ClientDashboard() {
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

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
      <div className="grid gap-4 md:grid-cols-2 col-span-full">
         <StatsCards tasks={tasks} />
      </div>
      <TasksOverviewChart tasks={tasks} />
      <RecentTasks tasks={dashboardTasks.recent} dueToday={dashboardTasks.dueToday} />
    </div>
  )
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
