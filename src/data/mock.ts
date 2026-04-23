import { User, Task, Project, Activity, Environment, Booking } from '../types';

export const currentUser: User = {
  id: 'u1',
  name: 'Alex Rivera',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  role: 'Diretor Criativo'
};

// ... existing users ...

export const environments: Environment[] = [
  {
    id: 'env1',
    name: 'Sala de Guerra Alpha',
    description: 'Ambiente de alta performance para decisões críticas e sprints intensivas.',
    rules: [
      'Proibido dispositivos não autorizados',
      'Silêncio absoluto durante sessões de foco',
      'Reservas com no mínimo 2h de antecedência'
    ],
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=1000',
    capacity: 12
  },
  {
    id: 'env2',
    name: 'Laboratório de Inovação',
    description: 'Espaço criativo focado em prototipagem rápida e brainstorming.',
    rules: [
      'Organizar materiais após o uso',
      'Permitido música em volume moderado',
      'Café liberado apenas em copos térmicos'
    ],
    image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1000',
    capacity: 20
  }
];

export const bookings: Booking[] = [
  {
    id: 'b1',
    environmentId: 'env1',
    userId: 'u1',
    startTime: '2024-04-16T14:00:00Z',
    endTime: '2024-04-16T15:30:00Z',
    title: 'Review de Arquitetura'
  }
];

export const users: User[] = [
  { id: 'u2', name: 'Jordan D.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', role: 'Engenheiro Sênior' },
  { id: 'u3', name: 'Sarah K.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', role: 'Designer de Produto' },
  { id: 'u4', name: 'Marcus L.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop', role: 'DevOps' }
];

export const tasks: Task[] = [
  {
    id: 't1',
    title: 'Migração de infraestrutura para AWS Lambda',
    project: 'Escalonamento Q3',
    projectId: 'p2',
    status: 'Em Progresso',
    priority: 'Urgente',
    assignees: [users[0], users[1]],
    dueDate: '2024-08-14'
  },
  {
    id: 't2',
    title: 'Refatoração do microserviço de autenticação',
    project: 'Security Shield',
    projectId: 'p3',
    status: 'Pendente',
    priority: 'Média',
    assignees: [users[2]],
    dueDate: '2024-09-02'
  },
  {
    id: 't3',
    title: 'UI Kit: Refinamento do componente Table',
    project: 'Design System',
    projectId: 'p4',
    status: 'Pendente',
    priority: 'Alta',
    assignees: [],
    dueDate: '2024-10-10'
  },
  {
    id: 't4',
    title: 'Investigação de latência na API Global',
    project: 'Core API',
    projectId: 'p1',
    status: 'Resolvido',
    priority: 'Baixa',
    assignees: [users[1], users[2]],
    dueDate: '2024-07-28'
  }
];

export const projects: Project[] = [
  {
    id: 'p1',
    name: 'Expansão Global 2024',
    description: 'Iniciativa estratégica para implantar infraestrutura em novos hubs continentais.',
    status: 'Em Andamento',
    progress: 82,
    burnRate: '$2.4M',
    type: 'INFRA',
    members: [users[0], users[1]],
    riskProfile: [
      { label: 'Volatilidade', level: 'high' },
      { label: 'Recursos', level: 'low' }
    ]
  },
  {
    id: 'p2',
    name: 'Escalonamento Q3',
    description: 'Otimização de custos e automação de processos para o terceiro trimestre.',
    status: 'Planejamento',
    progress: 15,
    burnRate: '$800K',
    type: 'OTIMIZAÇÃO',
    members: [users[1], users[2]],
    riskProfile: [
      { label: 'Prazos', level: 'medium' }
    ]
  },
  {
    id: 'p3',
    name: 'Security Shield V2',
    description: 'Endurecimento completo da camada de segurança e auditorias externas.',
    status: 'Em Andamento',
    progress: 45,
    burnRate: '$1.2M',
    type: 'SECURITY',
    members: [users[0], users[2]],
    riskProfile: [
      { label: 'Compliance', level: 'high' }
    ]
  },
  {
    id: 'p4',
    name: 'Design System Opero',
    description: 'Unificação da linguagem visual e componentes em todas as plataformas.',
    status: 'Em Andamento',
    progress: 92,
    burnRate: '$400K',
    type: 'DESIGN',
    members: [users[1]],
    riskProfile: [
      { label: 'Coerência', level: 'low' }
    ]
  },
  {
    id: 'p-saas-1',
    name: 'Ibiunet Cloud Release',
    description: 'Plataforma de gestão integrada para operações ibiunet.',
    type: 'SAAS',
    status: 'Em Andamento',
    progress: 45,
    riskProfile: [{ label: 'Escalabilidade', level: 'high' }],
    burnRate: '$1.2M',
    qualityData: {
      log: [
        {
          id: 'log1',
          date: '2024-04-20T10:00:00Z',
          version: 'v1.0.4',
          rawText: 'Lançamento inicial da plataforma interna. Foram mapeados os serviços de autenticação e o banco de dados. Resolvido o problema de latência que acontecia no login.',
          analysis: {
            features: ['Integração de serviços de autenticação', 'Setup robusto do banco de dados'],
            bugs: ['Resolvido problema grave de latência no login'],
            infra: ['Otimização inicial de API cloud'],
            impact: 'high'
          }
        }
      ]
    }
  },
  {
    id: 'p-cert-1',
    name: 'Adequação LGPD Global',
    description: 'Centralização de contratos, políticas de privacidade e solicitações de assinaturas.',
    type: 'CERTIFICAÇÃO',
    status: 'Em Progresso',
    progress: 30,
    riskProfile: [{ label: 'Jurídico', level: 'high' }],
    burnRate: 'Sob Controle',
    complianceData: {
      documents: [
        {
          id: 'doc-1',
          title: 'Política de Tratamento de Dados v2.0',
          type: 'policy',
          status: 'pending_signature',
          department: 'Jurídico',
          dueDate: '2024-06-01',
          signers: [
            { name: 'Diretoria Executiva', email: 'diretoria@ibiunet.com', signed: false },
            { name: 'DPO', email: 'dpo@ibiunet.com', signed: true, signedAt: '2024-05-15T14:00:00Z' }
          ]
        },
        {
          id: 'doc-2',
          title: 'Aviso de Privacidade - Setor Comercial',
          type: 'report',
          status: 'draft',
          department: 'Comercial'
        }
      ]
    }
  }
];

export const activities: Activity[] = [
  {
    id: 'a1',
    user: users[1],
    action: 'integrou',
    target: 'feat/auth-v2 em Produção',
    time: 'Há 2h',
    type: 'DESENVOLVIMENTO',
    tags: ['URGENTE']
  },
  {
    id: 'a2',
    user: users[2],
    action: 'concluiu a revisão de design para',
    target: '"Zenith UI"',
    time: '09:15 AM',
    type: 'DESIGN'
  }
];
