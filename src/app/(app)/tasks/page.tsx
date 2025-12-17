"use client";

import { useMemo } from "react";
import { useUser, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Task } from "@/lib/types";
import { TaskList } from "@/components/tasks/task-list";
import { Skeleton } from "@/components/ui/skeleton";

export default function TasksPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const tasksQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, "users", user.uid, "tasks");
  }, [user, firestore]);

  const { data: tasks, isLoading } = useCollection<Task>(tasksQuery);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">All Tasks</h1>
      {isLoading ? (
        <TasksSkeleton />
      ) : (
        <TaskList initialTasks={tasks || []} />
      )}
    </>
  );
}


function TasksSkeleton() {
    return (
        <div className="border rounded-lg p-6">
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    )
}
