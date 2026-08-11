import React from 'react';
import {
  Layout,
  BarChart2,
  Zap,
  Calendar,
  Plus,
  Users,
  FolderKanban,
  FileText,
  ChevronRight,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { Board, User } from '../../types';

interface SidebarProps {
  boards: Board[];
  activeBoardId: string | null;
  activeTab: 'board' | 'dashboard' | 'automations' | 'meetings' | 'users' | 'okrs';
  currentUser: User | null;
  onSelectBoard: (boardId: string) => void;
  onSelectTab: (tab: 'board' | 'dashboard' | 'automations' | 'meetings' | 'users' | 'okrs') => void;
  onCreateBoard: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  boards = [],
  activeBoardId,
  activeTab,
  currentUser,
  onSelectBoard,
  onSelectTab,
  onCreateBoard,
}) => {
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMIN';
  const safeBoards = Array.isArray(boards) ? boards : [];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 select-none h-[calc(100vh-3.5rem)]">
      {/* Workspace Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">
            M365
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Tenant Corporativo</h2>
            <p className="text-[11px] text-slate-400">Microsoft Entra ID Linked</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="p-3 space-y-1 border-b border-slate-800">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-blue-400" />
          <span>Dashboard Maestro</span>
        </button>

        <button
          onClick={() => onSelectTab('okrs')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'okrs'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Target className="w-4 h-4 text-purple-400" />
          <span>Objetivos & OKRs</span>
        </button>

        <button
          onClick={() => onSelectTab('automations')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'automations'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Zap className="w-4 h-4 text-yellow-400" />
          <span>Motor Automatizaciones</span>
        </button>

        <button
          onClick={() => onSelectTab('meetings')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'meetings'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4 text-purple-400" />
          <span>Juntas & Minutas M365</span>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => onSelectTab('users')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-bold transition-colors ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-md'
                : 'hover:bg-slate-800 text-purple-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-300" />
            <span>Usuarios SuperAdmin</span>
          </button>
        )}
      </div>

      {/* Boards Section */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Tableros de Trabajo
          </span>
          <button
            onClick={onCreateBoard}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            title="Crear nuevo tablero"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          {safeBoards.map((b) => {
            const isSelected = activeTab === 'board' && activeBoardId === b.id;
            return (
              <button
                key={b.id}
                onClick={() => {
                  onSelectBoard(b.id);
                  onSelectTab('board');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md font-semibold'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <FolderKanban className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-400'}`} />
                  <span className="truncate">{b.title}</span>
                </div>
                {isSelected && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Teams M365 Footer Info */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400 font-medium">
            {(currentUser?.name || 'SuperAdmin').split(' ')[0]} ({currentUser?.role || 'SUPERADMIN'})
          </span>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      </div>
    </aside>
  );
};
