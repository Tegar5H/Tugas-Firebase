
"use server";

import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Task } from "@/lib/types";
import { suggestTaskLabels } from "@/ai/flows/suggest-task-labels";

const TaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  deadline: z.string().nullable(),
  labels: z.array(z.string()).optional(),
  status: z.enum(["todo", "in-progress", "done"]).optional(),
});

export async function getTasks(userId: string) {
  if (!userId) return [];
  const tasksCol = collection(db, "tasks");
  const q = query(tasksCol, where("userId", "==", userId), orderBy("createdAt", "desc"));
  const taskSnapshot = await getDocs(q);
  const taskList = taskSnapshot.docs.map(doc => {
      const data = doc.data();
      // Firestore timestamps need to be converted
      return { 
          id: doc.id, 
          ...data,
          deadline: data.deadline || null, // Ensure deadline is string or null
          createdAt: data.createdAt,
      } as Task;
  });
  return taskList;
}

export async function getDashboardTasks(userId: string) {
  if (!userId) return { recent: [], dueToday: [] };

  const tasksCol = collection(db, "tasks");

  // Recent tasks
  const recentQuery = query(
    tasksCol,
    where("userId", "==", userId),
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

  // For "dueToday", we can't effectively query by a string date field for ranges.
  // This will be left empty as the data type doesn't support the query.
  // A more robust solution would involve storing deadlines as timestamps.
  const dueToday: Task[] = [];
  
  return { recent, dueToday };
}


export async function createTask(formData: FormData) {
  const values = {
    title: formData.get('title'),
    description: formData.get('description'),
    deadline: formData.get('deadline') || null,
    labels: formData.has('labels') ? JSON.parse(formData.get('labels') as string) : [],
  };

  const parsed = TaskSchema.safeParse(values);

  if (!parsed.success) {
    return { error: parsed.error.format() };
  }

  const { title, description, deadline, labels } = parsed.data;
  const userId = auth.currentUser?.uid;

  if (!userId) {
    return { error: "User not authenticated." };
  }

  try {
    await addDoc(collection(db, "tasks"), {
      title,
      description: description ?? "",
      status: "todo",
      deadline: deadline ?? null,
      labels: labels ?? [],
      userId,
      createdAt: Timestamp.now(),
    });
    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to create task." };
  }
}

export async function updateTask(taskId: string, formData: FormData) {
    const values = {
        title: formData.get('title'),
        description: formData.get('description'),
        deadline: formData.get('deadline') || null,
        labels: formData.has('labels') ? JSON.parse(formData.get('labels') as string) : [],
        status: formData.get('status') || 'todo',
    };
    
    const parsed = TaskSchema.safeParse(values);

   if (!parsed.success) {
    return { error: parsed.error.format() };
  }

  const { title, description, deadline, labels, status } = parsed.data;
  const userId = auth.currentUser?.uid;

  if (!userId) {
    return { error: "User not authenticated." };
  }
  
  try {
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, {
      title,
      description: description ?? "",
      deadline: deadline ?? null,
      labels: labels ?? [],
      status: status ?? "todo",
    });
    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to update task." };
  }
}

export async function updateTaskStatus(taskId: string, status: 'todo' | 'in-progress' | 'done') {
  const userId = auth.currentUser?.uid;
  if (!userId) return { error: "User not authenticated." };

  try {
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, { status });
    revalidatePath('/dashboard');
    revalidatePath('/tasks');
    return { success: true };
  } catch (e) {
    return { error: 'Failed to update task status.' };
  }
}

export async function deleteTask(taskId: string) {
  const userId = auth.currentUser?.uid;
  if (!userId) return { error: "User not authenticated." };

  try {
    await deleteDoc(doc(db, "tasks", taskId));
    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    return { success: true };
  } catch (e) {
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
