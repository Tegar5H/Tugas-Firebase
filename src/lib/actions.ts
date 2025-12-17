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
  deadline: z.date().nullable(),
  labels: z.array(z.string()).optional(),
  status: z.enum(["todo", "in-progress", "done"]).optional(),
});

export async function getTasks(userId: string) {
  if (!userId) return [];
  const tasksCol = collection(db, "tasks");
  const q = query(tasksCol, where("userId", "==", userId), orderBy("createdAt", "desc"));
  const taskSnapshot = await getDocs(q);
  const taskList = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
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
  const recent = recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

  // Tasks due today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueTodayQuery = query(
    tasksCol,
    where("userId", "==", userId),
    where("deadline", ">=", Timestamp.fromDate(today)),
    where("deadline", "<", Timestamp.fromDate(tomorrow))
  );
  const dueTodaySnapshot = await getDocs(dueTodayQuery);
  const dueToday = dueTodaySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
  
  return { recent, dueToday };
}


export async function createTask(formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  const parsed = TaskSchema.safeParse({
    title: values.title,
    description: values.description,
    deadline: values.deadline ? new Date(values.deadline as string) : null,
    labels: values.labels ? JSON.parse(values.labels as string) : [],
  });

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
      deadline: deadline ? Timestamp.fromDate(deadline) : null,
      labels: labels ?? [],
      userId,
      createdAt: Timestamp.now(),
    });
    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    return { success: true };
  } catch (e) {
    return { error: "Failed to create task." };
  }
}

export async function updateTask(taskId: string, formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  const parsed = TaskSchema.safeParse({
    title: values.title,
    description: values.description,
    deadline: values.deadline ? new Date(values.deadline as string) : null,
    labels: values.labels ? JSON.parse(values.labels as string) : [],
    status: values.status
  });

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
      deadline: deadline ? Timestamp.fromDate(deadline) : null,
      labels: labels ?? [],
      status: status ?? "todo",
    });
    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    return { success: true };
  } catch (e) {
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
