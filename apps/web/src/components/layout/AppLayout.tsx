import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Board } from '../../types';

interface AppLayoutProps {
  boards: Board[];
  activeBoardId: string | null;
  activeTab: 'board' | 'dashboard' | 'automations' | 'meetings' | 'users' | 'okrs';
  onSelectBoard: (boardId: string) => void;
  onSelectTab: (tab: 'board' | 'dashboard' | 'automations' | 'meetings' | 'users' | 'okrs') => void;
  onCreateBoard: () => void;
  onOpenAutomations: () => void;
  onOpenUsers: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  boards,
  activeBoardId,
  activeTab,
  onSelectBoard,
  onSelectTab,
  onCreateBoard,
  onOpenAutomations,
  onOpenUsers,
  children,
}) => {
  const { currentUser, theme, toggleTheme, logout, setCurrentUser } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased select-none">
      <Header
        currentUser={currentUser}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={logout}
        onOpenAutomations={onOpenAutomations}
        onOpenUsers={onOpenUsers}
        onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          boards={boards}
          activeBoardId={activeBoardId}
          activeTab={activeTab}
          currentUser={currentUser}
          onSelectBoard={onSelectBoard}
          onSelectTab={onSelectTab}
          onCreateBoard={onCreateBoard}
        />

        <main className="flex-1 overflow-auto bg-slate-900/50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
