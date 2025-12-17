"use client";

import { useState, useMemo, useTransition } from "react";
import type { Task } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, PlusCircle, Trash } from "lucide-react";

import { TaskForm } from "./task-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteTask, updateTaskStatus } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

type SortOption = "createdAt_desc" | "createdAt_asc";

export function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("createdAt_desc");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const emptyImage = PlaceHolderImages.find(p => p.id === 'empty-tasks');


  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsFormOpen(true);
  };
  
  const handleCreate = () => {
    setSelectedTask(undefined);
    setIsFormOpen(true);
  }

  const handleDelete = (taskId: string) => {
    startTransition(async () => {
      const result = await deleteTask(taskId);
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Failed to delete task",
          description: result.error,
        });
      } else {
        toast({
          title: "Task deleted",
        });
      }
    });
  };

  const handleStatusChange = (taskId: string, currentStatus: Task['status']) => {
    startTransition(async () => {
      const newStatus = currentStatus === 'done' ? 'todo' : 'done';
      await updateTaskStatus(taskId, newStatus);
    });
  };

  const filteredAndSortedTasks = useMemo(() => {
    let tasks = [...initialTasks];

    // Filter
    if (filter !== "all") {
      tasks = tasks.filter((task) => {
        if (filter === 'completed') return task.status === 'done';
        if (filter === 'incomplete') return task.status !== 'done';
        return true;
      });
    }

    // Sort
    tasks.sort((a, b) => {
      switch (sort) {
        case "createdAt_desc":
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        case "createdAt_asc":
          return a.createdAt.toMillis() - b.createdAt.toMillis();
        default:
          return 0;
      }
    });

    return tasks;
  }, [initialTasks, filter, sort]);
  
  const sortLabels: Record<SortOption, string> = {
    createdAt_desc: "Newest First",
    createdAt_asc: "Oldest First",
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Tasks</CardTitle>
              <CardDescription>Manage and organize your tasks.</CardDescription>
            </div>
             <Button onClick={handleCreate}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Task
              </Button>
          </div>
          <div className="flex items-center justify-between pt-4">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Sort by: {sortLabels[sort]}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSort("createdAt_desc")}>Newest First</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSort("createdAt_asc")}>Oldest First</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedTasks.length > 0 ? (
            <div className="space-y-4">
              {filteredAndSortedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.status === "done"}
                    onCheckedChange={() => handleStatusChange(task.id, task.status)}
                    className="mt-1"
                    aria-label={`Mark ${task.title} as ${task.status === 'done' ? 'incomplete' : 'complete'}`}
                  />
                  <div className="grid gap-1 flex-1">
                    <p className={cn("font-semibold", task.status === 'done' && 'line-through text-muted-foreground')}>
                      {task.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                      <span>Created {formatDistanceToNow(task.createdAt.toDate(), { addSuffix: true })}</span>
                      {task.deadline && (
                         <Badge variant={"outline"}>
                            Due: {task.deadline}
                        </Badge>
                      )}
                    </div>
                     {task.labels && task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {task.labels.map(label => <Badge key={label} variant="secondary">{label}</Badge>)}
                        </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(task)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Task</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                           <Trash className="h-4 w-4" />
                           <span className="sr-only">Delete Task</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your task titled "{task.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(task.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isPending}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              {emptyImage && (
                <Image 
                    src={emptyImage.imageUrl} 
                    alt="No tasks" 
                    width={300} 
                    height={200}
                    data-ai-hint={emptyImage.imageHint}
                    className="mx-auto mb-4 rounded-lg"
                />
              )}
              <h3 className="text-xl font-semibold">No tasks found</h3>
              <p className="text-muted-foreground mt-2">
                Looks like you're all caught up! Or maybe you want to...
              </p>
              <Button className="mt-4" onClick={handleCreate}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Task
              </Button>
            </div>
          )}
        </CardContent>
        {filteredAndSortedTasks.length > 0 &&
            <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>{filteredAndSortedTasks.length}</strong> tasks.
            </div>
            </CardFooter>
        }
      </Card>
      <TaskForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        task={selectedTask}
      />
    </>
  );
}
