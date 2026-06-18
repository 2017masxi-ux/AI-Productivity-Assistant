export type TaskItem = {
  id: string;
  title: string;
  deadline?: string;
  notes?: string;
  priority?: number;
  quadrant?: string;
  done?: boolean;
};

export type SavedEmail = {
  id: string;
  subject: string;
  body: string;
  tone: string;
  audience: string;
  createdAt: number;
};
