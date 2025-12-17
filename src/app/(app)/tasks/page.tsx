import { getTasks } from "@/lib/actions";
import { auth } from "@/lib/firebase";
import { TaskList } from "@/components/tasks/task-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from 'react';

export default function TasksPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">All Tasks</h1>
      <Suspense fallback={<TasksSkeleton />}>
        <TasksData />
      </Suspense>
    </>
  );
}

async function TasksData() {
    // This is a simplified way to get UID on server for this project.
    // In a real app, this should be handled via a secure session.
    const uid = auth.currentUser?.uid;
    const tasks = uid ? await getTasks(uid) : [];
    return <TaskList initialTasks={tasks} />;
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
