export type Status = 'Em Progresso' | 'Pendente' | 'Resolvido' | 'Concluído';
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
  type: 'camera' | 'camera_bullet' | 'camera_dome' | 'box' | 'sensor' | 'pole' | 'rack' | 'switch' | 'dvr' | 'nvr' | 'router' | 'employee_box' | 'monitor_station' | 'street_lamp';
  x: number;
  y: number;
  label: string;
  angle?: number;
  fovRadius?: number;
  assignedUserId?: string;
  taskId?: string;
}

export interface CFTVLink {
  id: string;
  fromId: string;
  toId: string;
  type: 'utp' | 'fiber' | 'power';
  length?: number; // Metragem estimada
  path?: [number, number][]; // Caminho customizado (vértices desenhados)
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
    prices?: Record<string, number>;
    extraItems?: any[];
  };
  networkData?: {
    points: CFTVPoint[];
    links: CFTVLink[];
    prices?: Record<string, number>;
    extraItems?: any[];
  };
  milestones?: Milestone[];
  qualityData?: any;
  complianceData?: {
    documents: ComplianceDocument[];
  };
}

export interface ComplianceDocument {
  id: string;
  title: string;
  type: 'policy' | 'contract' | 'report' | 'evidence' | 'pop' | 'manual';
  status: 'draft' | 'pending_signature' | 'signed' | 'approved' | 'rejected';
  department: string;
  dueDate?: string;
  fileUrl?: string;
  content?: string; // Used for rich-text editing / collaboration
  attachments?: { id: string; name: string; url: string; uploadedAt: string }[];
  collaborators?: User[]; // Shared users
  signers?: { name: string; email: string; signed: boolean; signedAt?: string }[];
}

export interface QualityPoint {
  id: string;
  type: 'module' | 'bug' | 'adjustment' | 'feature' | 'test';
  x: number;
  y: number;
  label: string;
  taskId?: string;
}

export interface QualityLink {
  id: string;
  fromId: string;
  toId: string;
  type: 'dependency' | 'impact' | 'flow';
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

export interface Doc {
  id: string;
  title: string;
  content: string;
  type: 'doc' | 'sheet' | 'slide';
  updatedAt: string;
  authorId: string;
  author?: User;
  starred: boolean;
  visibility: 'private' | 'shared' | 'workspace';
}

export interface DocumentShare {
  id: string;
  documentId: string;
  userId: string;
  permission: 'view' | 'edit';
}
