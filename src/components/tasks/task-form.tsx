
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { collection, doc, Timestamp } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, X } from "lucide-react";
import type { Task } from "@/lib/types";
import { getLabelSuggestions } from "@/lib/actions";
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().optional(),
  deadline: z.string().nullable(),
  labels: z.array(z.string()),
  status: z.enum(["todo", "in-progress", "done"]).optional(),
});

type TaskFormValues = z.infer<typeof formSchema>;

type TaskFormProps = {
  task?: Task;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TaskForm({ task, isOpen, onOpenChange }: TaskFormProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isPending, startTransition] = useTransition();
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description,
          deadline: task.deadline || null,
          labels: task.labels || [],
          status: task.status,
        }
      : {
          title: "",
          description: "",
          deadline: null,
          labels: [],
          status: "todo",
        },
  });

  const handleSuggestLabels = async () => {
    const title = form.getValues("title");
    const description = form.getValues("description");
    if (!title) {
      toast({
        variant: "destructive",
        title: "Title is required",
        description: "Please enter a title to get suggestions.",
      });
      return;
    }

    setIsSuggesting(true);
    const result = await getLabelSuggestions(title, description || "");
    if (result.labels) {
      setSuggestions(result.labels);
    } else {
      toast({
        variant: "destructive",
        title: "Suggestion failed",
        description: result.error,
      });
    }
    setIsSuggesting(false);
  };

  const toggleLabel = (label: string) => {
    const currentLabels = form.getValues("labels");
    const newLabels = currentLabels.includes(label)
      ? currentLabels.filter((l) => l !== label)
      : [...currentLabels, label];
    form.setValue("labels", newLabels, { shouldDirty: true });
  };

  const removeLabel = (label: string) => {
    const currentLabels = form.getValues("labels");
    const newLabels = currentLabels.filter((l) => l !== label);
    form.setValue("labels", newLabels, { shouldDirty: true });
  };

  const onSubmit = (values: TaskFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Not authenticated",
        description: "You must be logged in to modify tasks.",
      });
      return;
    }

    startTransition(() => {
      try {
        if (task) {
          // Update existing task
          const taskRef = doc(firestore, "users", user.uid, "tasks", task.id);
          const taskData = {
            ...values,
            description: values.description ?? "",
            deadline: values.deadline ?? null,
            labels: values.labels ?? [],
          };
          updateDocumentNonBlocking(taskRef, taskData);
           toast({
            title: "Task updated",
            description: `"${values.title}" has been saved.`,
          });
        } else {
          // Create new task
          const tasksCol = collection(firestore, "users", user.uid, "tasks");
          const taskData = {
            ...values,
            userId: user.uid,
            description: values.description ?? "",
            deadline: values.deadline ?? null,
            labels: values.labels ?? [],
            status: "todo",
            createdAt: Timestamp.now(),
          };
          addDocumentNonBlocking(tasksCol, taskData);
           toast({
            title: "Task created",
            description: `"${values.title}" has been added.`,
          });
        }

        onOpenChange(false);
        form.reset();
        setSuggestions([]);

      } catch (error) {
         toast({
          variant: "destructive",
          title: "An error occurred",
          description: "Could not save the task.",
        });
      }
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
          setSuggestions([]);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update your task details." : "Add a new task to your list."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Finalize project report"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add more details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="e.g., Tomorrow at 5pm"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="labels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Labels</FormLabel>
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSuggestLabels}
                      disabled={isSuggesting}
                    >
                      {isSuggesting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Suggest
                    </Button>
                  </div>
                  {suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                      {suggestions.map((suggestion) => (
                        <Badge
                          key={suggestion}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => toggleLabel(suggestion)}
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {field.value.map((label) => (
                      <Badge key={label} variant="default">
                        {label}
                        <button
                          type="button"
                          onClick={() => removeLabel(label)}
                          className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <X className="h-3 w-3 text-primary-foreground hover:text-white" />
                          <span className="sr-only">
                            Remove {label}
                          </span>
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {task ? "Save Changes" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
