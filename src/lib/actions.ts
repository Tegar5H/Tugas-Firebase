
"use server";

import { collection, doc, getDocs, query, Timestamp, orderBy, limit } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Task } from "@/lib/types";
import { suggestTaskLabels } from "@/ai/flows/suggest-task-labels";
import { initializeFirebase } from "@/firebase/server-init";

const TaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  deadline: z.string().nullable(),
  labels: z.array(z.string()),
  status: z.enum(["todo", "in-progress", "done"]).optional(),
});


export async function getTasks(userId: string) {
  if (!userId) return [];
  const { firestore } = initializeFirebase();
  const tasksCol = collection(firestore, "users", userId, "tasks");
  const q = query(tasksCol, orderBy("createdAt", "desc"));
  const taskSnapshot = await getDocs(q);
  const taskList = taskSnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
          id: doc.id, 
          ...data,
          deadline: data.deadline || null,
          createdAt: data.createdAt,
      } as Task;
  });
  return taskList;
}

export async function getDashboardTasks(userId: string) {
  if (!userId) return { recent: [], dueToday: [] };
  const { firestore } = initializeFirebase();
  const tasksCol = collection(firestore, "users", userId, "tasks");

  const recentQuery = query(
    tasksCol,
    orderBy("createdAt", "desc"),
    limit(5)
  );
  const recentSnapshot = await getDocs(recentQuery);
  const recent = recentSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      deadline: data.deadline || null,
      createdAt: data.createdAt,
    } as Task;
  });
  
  // This part remains ineffective due to the data model, but is kept for structure.
  const dueToday: Task[] = [];
  
  return { recent, dueToday };
}

// NOTE: createTask is now handled client-side in task-form.tsx

// NOTE: updateTask is now handled client-side in task-form.tsx


export async function updateTaskStatus(userId: string, taskId: string, status: 'todo' | 'in-progress' | 'done') {
  if (!userId) return { error: "User not authenticated." };

  try {
    const { firestore } = initializeFirebase();
    const taskRef = doc(firestore, "users", userId, "tasks", taskId);
    await doc(taskRef, { status }).update();
    revalidatePath('/dashboard');
    revalidatePath('/tasks');
    return { success: true };
  } catch (e: any) {
    return { error: 'Failed to update task status.' };
  }
}

export async function deleteTask(userId: string, taskId: string) {
  if (!userId) return { error: "User not authenticated." };

  try {
    const { firestore } = initializeFirebase();
    await doc(firestore, "users", userId, "tasks", taskId).delete();
    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    return { success: true };
  } catch (e: any) {
    return { error: "Failed to delete task." };
  }
}


export async function getLabelSuggestions(title: string, description: string) {
  try {
    const result = await suggestTaskLabels({ title, description });
    return { labels: result.labels };
  } catch (error) {
    return { error: "Failed to get suggestions." };
  }
}
