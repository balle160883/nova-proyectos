import React from 'react';
import { Board, User } from '../../types';
import { BarChart2, CheckCircle2, AlertCircle, Clock, Users, Zap, Award } from 'lucide-react';

interface MasterDashboardProps {
  boards: Board[];
  users: User[];
}

export const MasterDashboard: React.FC<MasterDashboardProps> = ({ boards = [], users = [] }) => {
  const safeBoards = Array.isArray(boards) ? boards : [];
  const safeUsers = Array.isArray(users) ? users : [];

  const allItems = safeBoards.flatMap((b) => {
    const groups = Array.isArray(b?.groups) ? b.groups : [];
    return groups.flatMap((g) => (Array.isArray(g?.items) ? g.items : []));
  });

  const totalTasks = allItems.length;
  const completedTasks = allItems.filter((i) => i.status === 'Completed').length;
  const blockedTasks = allItems.filter((i) => i.status === 'Blocked').length;
  const inProgressTasks = allItems.filter((i) => i.status === 'In Progress').length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50 select-none">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Maestro Multi-Equipo</h1>
        <p className="text-xs text-slate-500 mt-1">Consolidado en tiempo real de avance, cargas de trabajo y entregables del tenant M365.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tareas</span>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">{totalTasks}</div>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">% Tasa de Avance</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{completionRate}%</div>
          </div>
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bloqueadas (Teams)</span>
            <div className="text-2xl font-extrabold text-red-600 mt-1">{blockedTasks}</div>
          </div>
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">En Progreso</span>
            <div className="text-2xl font-extrabold text-purple-600 mt-1">{inProgressTasks}</div>
          </div>
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Charts & Widgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload by Assignee */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Carga de Trabajo por Persona</span>
            </h3>
            <span className="text-xs text-slate-400">Microsoft Entra ID Team</span>
          </div>

          <div className="space-y-3 pt-2">
            {safeUsers.map((user) => {
              const userTasks = allItems.filter((i) => i.assignedToId === user.id);
              const count = userTasks.length;
              const completedCount = userTasks.filter((i) => i.status === 'Completed').length;
              const pct = totalTasks ? Math.round((count / totalTasks) * 100) : 0;

              return (
                <div key={user.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      <img
                        src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'}
                        alt={user.name || 'User'}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-slate-800 font-semibold">{user.name || 'Usuario'}</span>
                    </div>
                    <span className="text-slate-500">{count} tareas ({completedCount} completadas)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(pct * 3, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Board Overview & Status Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Resumen por Tablero de Trabajo</span>
          </h3>

          <div className="space-y-4 pt-2">
            {safeBoards.map((b) => {
              const groups = Array.isArray(b?.groups) ? b.groups : [];
              const bItems = groups.flatMap((g) => (Array.isArray(g?.items) ? g.items : []));
              const bCompleted = bItems.filter((i) => i.status === 'Completed').length;
              const bTotal = bItems.length;
              const bPct = bTotal ? Math.round((bCompleted / bTotal) * 100) : 0;

              return (
                <div key={b.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{b.title}</span>
                    <span className="font-semibold text-emerald-600">{bPct}% Completado</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${bPct}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{bTotal} tareas totales</span>
                    <span>{b.automations?.length || 0} automatizaciones activas</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
