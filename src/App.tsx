/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './views/Dashboard';
import Projects from './views/Projects';
import ProjectDetail from './views/ProjectDetail';
import Editor from './views/Editor';
import Schedule from './views/Schedule';
import Login from './views/Login';
import Settings from './views/Settings';
import ResourceMap from './views/ResourceMap';
import AnoAI from './components/ui/animated-shader-background';
import { cn } from './lib/utils';
import { supabase } from './lib/supabase';

import { useData, DataProvider } from './DataContext';

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

function AppContent() {
  const { session, isAuthReady } = useData();
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [userSidebarPreference, setUserSidebarPreference] = useState(true);
  const [showTopbar, setShowTopbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      setShowTopbar(false); // Scrolling down
      setIsSidebarVisible(false); // Hide sidebar too
    } else if (currentScrollY < lastScrollY) {
      setShowTopbar(true); // Scrolling up
      setIsSidebarVisible(userSidebarPreference); // Restore user preference
    }
    setLastScrollY(currentScrollY);
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard key="dashboard" onViewChange={setActiveView} />;
      case 'resource_map':
        return <ResourceMap key="resource_map" />;
      case 'projects':
        return <Projects key="projects" onViewChange={setActiveView} />;
      case 'analytics':
        return <ProjectDetail key="analytics" />;
      case 'documents':
        return <Editor key="documents" />;
      case 'schedule':
        return <Schedule key="schedule" />;
      case 'settings':
        return <Settings key="settings" />;
      default:
        return <Dashboard key="dashboard" />;
    }
  };

  if (!isAuthReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <AnoAI />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-2xl font-black tracking-tighter text-white z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
        >
          Opero
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen">
      <AnoAI />
      
      {!session ? (
        <Login />
      ) : (
        <div className="flex w-full min-h-screen bg-transparent">
          <Sidebar 
            activeView={activeView} 
            onViewChange={setActiveView} 
            isVisible={isSidebarVisible} 
            onToggle={() => {
              const next = !userSidebarPreference;
              setUserSidebarPreference(next);
              setIsSidebarVisible(next);
            }}
          />
          
          <div className={cn(
            "flex-1 flex flex-col relative z-10 transition-[padding] duration-300 ease-in-out",
            isSidebarVisible ? "pl-64" : "pl-0"
          )}>
            <Topbar 
              isSidebarVisible={isSidebarVisible} 
              onToggleSidebar={() => {
                const next = !userSidebarPreference;
                setUserSidebarPreference(next);
                setIsSidebarVisible(next);
              }} 
              isVisible={showTopbar}
              onViewChange={setActiveView}
              activeView={activeView}
            />
            
            <main 
              className="flex-1 overflow-y-auto overflow-x-hidden"
              onScroll={handleScroll}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="h-full"
                >
                  {renderView()}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>

          {/* Floating Global Context Button */}
          {activeView !== 'documents' && (
            <button className={cn(
                "fixed bottom-8 right-8 h-14 w-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group z-50",
                !showTopbar && "translate-y-24 opacity-0"
              )}>
              <motion.div
                animate={{ rotate: [0, 90, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              >
                <div className="w-1 h-1 bg-white mb-0.5 rounded-full" />
                <div className="w-1 h-1 bg-white mb-0.5 rounded-full" />
                <div className="w-1 h-1 bg-white rounded-full" />
              </motion.div>
              <span className="absolute right-16 bg-black text-white px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Ação Rápida
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

