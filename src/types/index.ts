export type Status = 'Em Progresso' | 'Bloqueado' | 'Pendente' | 'Resolvido' | 'Concluído';
export type Priority = 'Urgente' | 'Alta' | 'Média' | 'Baixa';

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  time: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  project: string;
  projectId: string;
  status: Status;
  priority: Priority;
  assignees: User[];
  dueDate: string;
  images?: string[];
  comments?: Comment[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  burnRate: string;
  type?: string;
  members?: User[];
  riskProfile: {
    label: string;
    level: 'high' | 'medium' | 'low';
  }[];
}

export interface Activity {
  id: string;
  user: User;
  action: string;
  target: string;
  time: string;
  type: string;
  tags?: string[];
}

export interface Environment {
  id: string;
  name: string;
  description: string;
  rules: string[];
  image: string;
  capacity: number;
}

export interface Booking {
  id: string;
  environmentId: string;
  userId: string;
  startTime: string;
  endTime: string;
  title: string;
}
