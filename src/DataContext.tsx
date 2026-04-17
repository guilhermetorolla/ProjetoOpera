import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project, Task, Activity, User, Environment, Booking } from './types';
import { projects as initialProjects, tasks as initialTasks, activities as initialActivities, users as initialUsers, environments as initialEnvironments, bookings as initialBookings, currentUser as initialCurrentUser } from './data/mock';

interface DataContextType {
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
  users: User[];
  environments: Environment[];
  bookings: Booking[];
  currentUser: User;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  setEnvironments: React.Dispatch<React.SetStateAction<Environment[]>>;
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  logActivity: (action: string, target: string, type: string, tags?: string[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [environments, setEnvironments] = useState<Environment[]>(initialEnvironments);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [users] = useState<User[]>(initialUsers);
  const [currentUser] = useState<User>(initialCurrentUser);

  const logActivity = (action: string, target: string, type: string, tags?: string[]) => {
    const newActivity: Activity = {
      id: `a${Date.now()}`,
      user: currentUser,
      action,
      target,
      time: 'Agora',
      type: type as any,
      tags
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 10)); // Keep last 10
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
      setProjects,
      setTasks,
      setActivities,
      setEnvironments,
      setBookings,
      logActivity
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
