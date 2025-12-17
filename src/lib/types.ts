import type { Timestamp } from "firebase/firestore";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  deadline: string | null;
  labels: string[];
  userId: string;
  createdAt: Timestamp;
};
