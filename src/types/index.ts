export type Status = 'Em Progresso' | 'Bloqueado' | 'Pendente' | 'Resolvido' | 'Concluído';
export type Priority = 'Urgente' | 'Alta' | 'Média' | 'Baixa';

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email?: string;
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

export interface CFTVPoint {
  id: string;
  type: 'camera' | 'box' | 'sensor';
  x: number;
  y: number;
  label: string;
}

export interface CFTVLink {
  id: string;
  fromId: string;
  toId: string;
  type: 'utp' | 'fiber' | 'power';
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
  cftvData?: {
    points: CFTVPoint[];
    links: CFTVLink[];
  };
  milestones?: Milestone[];
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

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  isActive: boolean;
  isCompleted: boolean;
  createdAt?: string;
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
