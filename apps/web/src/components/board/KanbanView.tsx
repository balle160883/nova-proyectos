import React from 'react';
import { Board, Item, User } from '../../types';
import { User as UserIcon, Calendar, AlertCircle } from 'lucide-react';

interface KanbanViewProps {
  board: Board;
  users: User[];
  onUpdateStatus: (itemId: string, newStatus: string) => void;
}

const COLUMNS = [
  { id: 'Not Started', title: 'Por Hacer', color: 'border-t-slate-400 bg-slate-100/50' },
  { id: 'In Progress', title: 'En Progreso', color: 'border-t-blue-500 bg-blue-50/30' },
  { id: 'Blocked', title: '🚨 Bloqueado', color: 'border-t-red-500 bg-red-50/30' },
  { id: 'Completed', title: '✓ Completado', color: 'border-t-emerald-500 bg-emerald-50/30' },
];

export const KanbanView: React.FC<KanbanViewProps> = ({ board, users = [], onUpdateStatus }) => {
  const groups = Array.isArray(board?.groups) ? board.groups : [];
  const allItems = groups.flatMap((g) => (Array.isArray(g?.items) ? g.items : []));
  const safeUsers = Array.isArray(users) ? users : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-12 select-none">
      {COLUMNS.map((col) => {
        const colItems = allItems.filter((i) => (i?.status || 'Not Started') === col.id);
        return (
          <div key={col.id} className={`bg-white rounded-xl border border-slate-200 border-t-4 ${col.color} p-4 shadow-sm flex flex-col min-h-[500px]`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm">{col.title}</h3>
              <span className="bg-slate-200 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {colItems.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {colItems.map((item) => {
                const assignee = safeUsers.find((u) => u.id === item.assignedToId);
                return (
                  <div
                    key={item.id}
                    className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-slate-800 text-xs leading-snug">{item.title}</h4>
                      {item.status === 'Blocked' && (
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 ml-2 animate-bounce" />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-1.5">
                        {assignee ? (
                          <div className="flex items-center space-x-1">
                            <img src={assignee.avatarUrl} alt={assignee.name} className="w-4 h-4 rounded-full object-cover" />
                            <span className="font-medium text-slate-700">{assignee.name.split(' ')[0]}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin Asignar</span>
                        )}
                      </div>

                      {item.dueDate && (
                        <div className="flex items-center space-x-1 text-slate-500">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{new Date(item.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Move Status Buttons */}
                    <div className="flex items-center space-x-1 pt-1">
                      {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => onUpdateStatus(item.id, c.id)}
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition-colors"
                        >
                          Mover a {c.title.replace('🚨 ', '').replace('✓ ', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
