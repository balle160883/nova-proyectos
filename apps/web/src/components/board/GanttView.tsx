import React, { useState } from 'react';
import { Board, Item, User } from '../../types';
import { Calendar, ChevronLeft, ChevronRight, Clock, AlertCircle, CheckCircle2, User as UserIcon, ZoomIn, ZoomOut } from 'lucide-react';

interface GanttViewProps {
  board: Board;
  users: User[];
  onUpdateStatus: (itemId: string, newStatus: string) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Not Started': { bg: 'bg-slate-400', text: 'text-slate-800', border: 'border-slate-500' },
  'In Progress': { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
  'Blocked': { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600' },
  'Completed': { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600' },
};

export const GanttView: React.FC<GanttViewProps> = ({ board, users = [], onUpdateStatus }) => {
  const [zoomMode, setZoomMode] = useState<'days' | 'weeks'>('days');

  const groups = Array.isArray(board?.groups) ? board.groups : [];
  const safeUsers = Array.isArray(users) ? users : [];

  // Generate timeline date columns (current month days + next days)
  const today = new Date();
  const daysCount = zoomMode === 'days' ? 14 : 30;

  const timelineDates = Array.from({ length: daysCount }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 2 + i);
    return d;
  });

  const getPositionAndWidth = (dueDateStr?: string) => {
    if (!dueDateStr) return { offsetPercent: 5, widthPercent: 20 };

    const due = new Date(dueDateStr);
    const start = new Date(today);
    start.setDate(today.getDate() - 2);

    const diffDays = Math.ceil((due.getTime() - start.getTime()) / (1000 * 3600 * 24));
    const offset = Math.max(0, Math.min(diffDays, daysCount - 3));
    const width = Math.max(2, 4);

    const offsetPercent = (offset / daysCount) * 100;
    const widthPercent = (width / daysCount) * 100;

    return { offsetPercent, widthPercent };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col select-none">
      {/* Toolbar Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">
            📊
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Diagrama de Gantt & Cronograma de Entregables</h3>
            <p className="text-xs text-slate-500">Línea de tiempo interactiva de proyectos y fechas críticas de ejecución</p>
          </div>
        </div>

        {/* Zoom Controls & Legend */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-2 bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setZoomMode('days')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                zoomMode === 'days' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vista Días
            </button>
            <button
              onClick={() => setZoomMode('weeks')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                zoomMode === 'weeks' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vista Semanas
            </button>
          </div>

          <div className="hidden lg:flex items-center space-x-3 border-l border-slate-300 pl-3">
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] text-slate-600 font-medium">Completado</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-[11px] text-slate-600 font-medium">En Progreso</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="text-[11px] text-slate-600 font-medium">Bloqueado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Gantt Grid Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header Dates Bar */}
          <div className="flex border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold text-slate-600">
            {/* Left Panel Column Title */}
            <div className="w-72 p-3 border-r border-slate-200 flex-shrink-0 flex items-center justify-between">
              <span>Tarea / Entregable</span>
              <span className="text-[10px] text-slate-400 font-normal">Responsable</span>
            </div>

            {/* Timeline Days Header */}
            <div className="flex-1 grid grid-cols-14 divide-x divide-slate-200 text-center py-2">
              {timelineDates.map((date, idx) => {
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <div
                    key={idx}
                    className={`px-1 py-1 flex flex-col justify-center ${
                      isToday ? 'bg-blue-100/80 text-blue-700 font-extrabold' : ''
                    }`}
                  >
                    <span className="text-[10px] uppercase text-slate-400">
                      {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </span>
                    <span className="text-xs">{date.getDate()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gantt Group Rows */}
          <div className="divide-y divide-slate-100">
            {groups.map((group) => {
              const items = Array.isArray(group?.items) ? group.items : [];
              return (
                <div key={group.id} className="bg-white">
                  {/* Group Header Row */}
                  <div className="bg-slate-50/70 px-4 py-2 flex items-center space-x-2 border-b border-slate-100">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color || '#579BFC' }}></div>
                    <span className="font-bold text-xs text-slate-800 tracking-tight">{group.title}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                      {items.length} tareas
                    </span>
                  </div>

                  {/* Group Items Rows */}
                  <div className="divide-y divide-slate-50">
                    {items.map((item) => {
                      const assignee = safeUsers.find((u) => u.id === item.assignedToId);
                      const statusConfig = STATUS_COLORS[item.status || 'Not Started'] || STATUS_COLORS['Not Started'];
                      const { offsetPercent, widthPercent } = getPositionAndWidth(item.dueDate ? String(item.dueDate) : undefined);

                      return (
                        <div key={item.id} className="flex hover:bg-blue-50/30 transition-colors group items-center">
                          {/* Task Info Left Panel */}
                          <div className="w-72 p-3 border-r border-slate-200 flex-shrink-0 flex items-center justify-between space-x-2">
                            <div className="truncate flex-1">
                              <div className="font-semibold text-xs text-slate-800 truncate" title={item.title}>
                                {item.title}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Sin Fecha'}</span>
                              </div>
                            </div>

                            {/* Assignee Avatar */}
                            {assignee ? (
                              <img
                                src={assignee.avatarUrl}
                                alt={assignee.name}
                                className="w-6 h-6 rounded-full object-cover border border-slate-200 flex-shrink-0"
                                title={assignee.name}
                              />
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-[10px] flex items-center justify-center font-bold">
                                ?
                              </span>
                            )}
                          </div>

                          {/* Gantt Timeline Bar Area */}
                          <div className="flex-1 relative h-12 flex items-center px-2">
                            {/* Grid vertical lines background */}
                            <div className="absolute inset-0 grid grid-cols-14 divide-x divide-slate-100 pointer-events-none">
                              {timelineDates.map((_, i) => (
                                <div key={i} className="h-full"></div>
                              ))}
                            </div>

                            {/* Gantt Bar */}
                            <div
                              className={`h-7 rounded-xl shadow-sm ${statusConfig.bg} text-white text-[11px] font-bold flex items-center justify-between px-3 transition-all transform hover:scale-[1.02] cursor-pointer z-10`}
                              style={{
                                marginLeft: `${offsetPercent}%`,
                                width: `${Math.max(widthPercent, 18)}%`,
                              }}
                              onClick={() => {
                                const nextStatus =
                                  item.status === 'Not Started'
                                    ? 'In Progress'
                                    : item.status === 'In Progress'
                                    ? 'Completed'
                                    : item.status === 'Completed'
                                    ? 'Blocked'
                                    : 'Not Started';
                                onUpdateStatus(item.id, nextStatus);
                              }}
                              title="Haz clic para alternar estatus de la tarea"
                            >
                              <span className="truncate pr-1">{item.title}</span>
                              <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                                {item.status || 'Not Started'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
