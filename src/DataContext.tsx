import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Project, Task, Activity, User, Environment, Booking } from './types';
import { projects as initialProjects, tasks as initialTasks, activities as initialActivities, users as initialUsers, environments as initialEnvironments, bookings as initialBookings, currentUser as initialCurrentUser } from './data/mock';
import { supabase } from './lib/supabase';
import { dataService } from './services/dataService';

interface DataContextType {
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
  users: User[];
  environments: Environment[];
  bookings: Booking[];
  currentUser: User;
  session: any | null;
  isAuthReady: boolean;
  selectedProject: Project | null;
  showAnimation: boolean;
  setShowAnimation: (show: boolean) => void;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  setSelectedProject: React.Dispatch<React.SetStateAction<Project | null>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setEnvironments: React.Dispatch<React.SetStateAction<Environment[]>>;
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  logActivity: (action: string, target: string, type: string, tags?: string[]) => void;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [environments, setEnvironments] = useState<Environment[]>(initialEnvironments);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User>(initialCurrentUser);
  const [session, setSession] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAnimation, setShowAnimation] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('opero-show-animation');
        return saved === null ? true : saved === 'true';
      } catch (e) {
        return true; // Fallback if localStorage is blocked
      }
    }
    return true;
  });

  useEffect(() => {
    try {
      localStorage.setItem('opero-show-animation', String(showAnimation));
    } catch (e) {
      // Ignore if localStorage is blocked
    }
  }, [showAnimation]);

  const refreshData = async () => {
    try {
      console.log('DataContext: Iniciando refreshData...');
      const [p, t, a, u] = await Promise.all([
        dataService.getProjects(),
        dataService.getTasks(),
        dataService.getActivities(),
        dataService.getUsers()
      ]);
      
      console.log(`DataContext: Dados recebidos - Projetos: ${p.length}, Tarefas: ${t.length}, Atividades: ${a.length}, Usuários: ${u.length}`);
      setProjects(p);
      setTasks(t);
      setActivities(a);
      setUsers(u);
    } catch (error) {
      console.warn('DataContext: Erro ao buscar dados do Supabase, mantendo estado atual:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(initialSession);
          if (initialSession?.user) {
            setCurrentUser({
              id: initialSession.user.id,
              name: initialSession.user.user_metadata?.name || initialSession.user.email?.split('@')[0] || 'Usuário',
              email: initialSession.user.email || '',
              role: 'Operacional',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${initialSession.user.id}`
            });
            // Don't await refreshData here to avoid blocking isAuthReady
            refreshData();
          }
        }
      } catch (error) {
        console.error("Erro initializing auth:", error);
      } finally {
        if (isMounted) setIsAuthReady(true);
      }
    }

    initializeAuth();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (isMounted) {
        setSession(newSession);
        if (newSession?.user) {
          setCurrentUser({
            id: newSession.user.id,
            name: newSession.user.user_metadata?.name || newSession.user.email?.split('@')[0] || 'Usuário',
            email: newSession.user.email || '',
            role: 'Operacional',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newSession.user.id}`
          });
          refreshData();
        } else {
          setCurrentUser(initialCurrentUser);
        }
        setIsAuthReady(true);
      }
    });

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        refreshData();
      })
      .subscribe();

    return () => {
      authSub.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const logActivity = async (action: string, target: string, type: string, tags?: string[]) => {
    const newActivity: Activity = {
      id: `a${Date.now()}`,
      user: currentUser,
      action,
      target,
      time: 'Agora',
      type: type as any,
      tags
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 10));

    await dataService.logActivity(action, target, type, tags);
  };

  return (
    <DataContext.Provider value={{
      projects,
      tasks,
      activities,
      users,
      environments,
      bookings,
      currentUser,
      session,
      isAuthReady,
      selectedProject,
      showAnimation,
      setShowAnimation,
      setCurrentUser,
      setSelectedProject,
      setProjects,
      setTasks,
      setActivities,
      setUsers,
      setEnvironments,
      setBookings,
      logActivity,
      refreshData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
