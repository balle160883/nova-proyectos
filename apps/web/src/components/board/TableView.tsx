import React, { useState, useEffect, useRef } from 'react';
import { Plus, User as UserIcon, Calendar, CheckCircle2, ChevronDown, Trash2, AlertCircle, RefreshCw, Paperclip, Play, Pause, DollarSign, Upload, FileText, X, MessageSquare } from 'lucide-react';
import { Board, Item, Group, User, ItemAttachment } from '../../types';
import { api } from '../../services/api';
import { ItemUpdatesModal } from './ItemUpdatesModal';

interface TableViewProps {
  board: Board;
  users: User[];
  currentUser?: User | null;
  onUpdateStatus: (itemId: string, newStatus: string) => void;
  onUpdateAssignee: (itemId: string, userId: string) => void;
  onAddItem: (groupId: string, title: string) => void;
  onAddGroup: (title: string) => void;
  onSyncCalendar: (item: Item) => void;
  onDeleteItem: (itemId: string) => void;
  onRefreshBoard?: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Not Started': { bg: 'bg-slate-300 hover:bg-slate-400', text: 'text-slate-800' },
  'In Progress': { bg: 'bg-blue-500 hover:bg-blue-600', text: 'text-white' },
  'Blocked': { bg: 'bg-red-500 hover:bg-red-600', text: 'text-white' },
  'Completed': { bg: 'bg-emerald-500 hover:bg-emerald-600', text: 'text-white' },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  'Crítica': { bg: 'bg-red-100 text-red-800 border-red-300', text: 'Crítica 🔴' },
  'Alta': { bg: 'bg-amber-100 text-amber-800 border-amber-300', text: 'Alta 🟠' },
  'Media': { bg: 'bg-blue-100 text-blue-800 border-blue-300', text: 'Media 🟡' },
  'Baja': { bg: 'bg-slate-100 text-slate-700 border-slate-300', text: 'Baja 🔵' },
};

export const TableView: React.FC<TableViewProps> = ({
  board,
  users = [],
  currentUser = null,
  onUpdateStatus,
  onUpdateAssignee,
  onAddItem,
  onAddGroup,
  onSyncCalendar,
  onDeleteItem,
  onRefreshBoard = () => {},
}) => {
  const [newItemTitles, setNewItemTitles] = useState<Record<string, string>>({});
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);

  // Local state for priorities, budgets, and timers
  const [priorities, setPriorities] = useState<Record<string, string>>({});
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [timers, setTimers] = useState<Record<string, { seconds: number; running: boolean }>>({});

  // File upload modal & comments modal state (stored as ID strings for live board sync)
  const [activeFileModalItemId, setActiveFileModalItemId] = useState<string | null>(null);
  const [activeCommentItemId, setActiveCommentItemId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const groups = Array.isArray(board?.groups) ? board.groups : [];
  const safeUsers = Array.isArray(users) ? users : [];

  // Live item resolution from current board state
  const activeItemForFiles = activeFileModalItemId
    ? groups.flatMap((g) => (Array.isArray(g.items) ? g.items : [])).find((i) => i.id === activeFileModalItemId)
    : null;

  const activeCommentItem = activeCommentItemId
    ? groups.flatMap((g) => (Array.isArray(g.items) ? g.items : [])).find((i) => i.id === activeCommentItemId)
    : null;

  // Parse item attachments directly from database item object
  const getItemAttachments = (item: Item): ItemAttachment[] => {
    if (!item || !item.attachments) return [];
    if (Array.isArray(item.attachments)) return item.attachments;
    if (typeof item.attachments === 'string') {
      try {
        const parsed = JSON.parse(item.attachments);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const getItemCommentCount = (item: Item): number => {
    if (!item || !item.comments) return 0;
    if (Array.isArray(item.comments)) return item.comments.length;
    if (typeof item.comments === 'string') {
      try {
        const parsed = JSON.parse(item.comments);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  };

  // Timer interval tick effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev };
        let updated = false;
        Object.keys(next).forEach((id) => {
          if (next[id]?.running) {
            next[id] = { ...next[id], seconds: (next[id].seconds || 0) + 1 };
            updated = true;
          }
        });
        return updated ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds: number = 0) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = async (itemId: string, currentSeconds: number) => {
    const isRunning = timers[itemId]?.running || false;
    const nextRunning = !isRunning;
    const newSeconds = timers[itemId]?.seconds ?? currentSeconds;

    setTimers((prev) => ({
      ...prev,
      [itemId]: { seconds: newSeconds, running: nextRunning },
    }));

    if (!nextRunning) {
      await api.updateItem(itemId, { timerSeconds: newSeconds });
      onRefreshBoard();
    }
  };

  const handlePriorityChange = async (itemId: string, newPriority: string) => {
    setPriorities((prev) => ({ ...prev, [itemId]: newPriority }));
    await api.updateItem(itemId, { priority: newPriority });
    onRefreshBoard();
  };

  const handleBudgetBlur = async (itemId: string, newBudget: number) => {
    await api.updateItem(itemId, { budget: newBudget });
    onRefreshBoard();
  };

  const handleCreateItemSubmit = (groupId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = newItemTitles[groupId]?.trim();
    if (title) {
      onAddItem(groupId, title);
      setNewItemTitles((prev) => ({ ...prev, [groupId]: '' }));
    }
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupTitle.trim()) {
      onAddGroup(newGroupTitle.trim());
      setNewGroupTitle('');
      setShowAddGroup(false);
    }
  };

  const activeFileAttachments = activeItemForFiles ? getItemAttachments(activeItemForFiles) : [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeFileModalItemId || !activeItemForFiles) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (reader.result) {
          const newAtt: ItemAttachment = {
            id: `att-${Date.now()}`,
            name: file.name,
            url: reader.result as string,
          };
          const updatedList = [...activeFileAttachments, newAtt];

          await api.updateItem(activeFileModalItemId, {
            attachments: JSON.stringify(updatedList),
          });

          onRefreshBoard();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAttachment = async (attId: string) => {
    if (!activeFileModalItemId || !activeItemForFiles) return;
    const updatedList = activeFileAttachments.filter((a) => a.id !== attId);

    await api.updateItem(activeFileModalItemId, {
      attachments: JSON.stringify(updatedList),
    });

    onRefreshBoard();
  };

  return (
    <div className="space-y-6 pb-12">
      {groups.map((group) => {
        const items = Array.isArray(group?.items) ? group.items : [];
        const groupBudgetTotal = items.reduce((sum, item) => sum + (budgets[item.id] !== undefined ? budgets[item.id] : item.budget || 0), 0);

        return (
          <div key={group.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Group Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: group.color || '#579BFC' }}></div>
                <h3 className="font-semibold text-slate-800 text-sm">{group.title}</h3>
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  {items.length} tareas
                </span>
              </div>
              <div className="text-xs font-bold text-slate-600">
                Presupuesto Total Fase: <span className="text-emerald-600 font-extrabold">${groupBudgetTotal.toLocaleString()} MXN</span>
              </div>
            </div>

            {/* Table Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-4 w-7">#</th>
                    <th className="py-2.5 px-4 min-w-[220px]">Tarea / Entregable</th>
                    <th className="py-2.5 px-4 w-[140px]">Prioridad</th>
                    <th className="py-2.5 px-4 w-[150px]">Responsable</th>
                    <th className="py-2.5 px-4 w-[140px]">Estatus</th>
                    <th className="py-2.5 px-4 w-[130px]">Cronómetro</th>
                    <th className="py-2.5 px-4 w-[120px]">Presupuesto ($)</th>
                    <th className="py-2.5 px-4 w-[100px]">Archivos</th>
                    <th className="py-2.5 px-4 w-[130px]">Fecha Límite</th>
                    <th className="py-2.5 px-4 w-[70px] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const statusConfig = STATUS_COLORS[item.status || 'Not Started'] || STATUS_COLORS['Not Started'];
                    const currentPriority = priorities[item.id] || item.priority || 'Media';
                    const priorityConfig = PRIORITY_COLORS[currentPriority] || PRIORITY_COLORS['Media'];
                    const currentBudget = budgets[item.id] !== undefined ? budgets[item.id] : item.budget || 0;
                    const itemTimer = timers[item.id] || { seconds: item.timerSeconds || 0, running: false };
                    const itemFiles = getItemAttachments(item);
                    const commentCount = getItemCommentCount(item);

                    return (
                      <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>

                        {/* Title & Comment Button */}
                        <td className="py-3 px-4 font-medium text-slate-800">
                          <div className="flex items-center justify-between space-x-2">
                            <div className="flex items-center space-x-2 truncate">
                              <span className="truncate">{item.title}</span>
                              {item.status === 'Blocked' && (
                                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold flex items-center space-x-1 flex-shrink-0">
                                  <AlertCircle className="w-3 h-3 text-red-600" />
                                  <span>Bloqueado</span>
                                </span>
                              )}
                            </div>

                            {/* Comment Discussion Thread Button */}
                            <button
                              onClick={() => setActiveCommentItemId(item.id)}
                              className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-colors flex-shrink-0 ${
                                commentCount > 0
                                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                              }`}
                              title="Abrir hilo de conversación y comentarios de este entregable"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{commentCount}</span>
                            </button>
                          </div>
                        </td>

                        {/* Priority Dropdown */}
                        <td className="py-3 px-4">
                          <select
                            value={currentPriority}
                            onChange={(e) => handlePriorityChange(item.id, e.target.value)}
                            className={`w-full font-bold rounded-lg py-1 px-2 text-xs transition-all cursor-pointer border shadow-sm ${priorityConfig.bg}`}
                          >
                            <option value="Crítica">🔴 Crítica</option>
                            <option value="Alta">🟠 Alta</option>
                            <option value="Media">🟡 Media</option>
                            <option value="Baja">🔵 Baja</option>
                          </select>
                        </td>

                        {/* Assignee */}
                        <td className="py-3 px-4">
                          <select
                            value={item.assignedToId || ''}
                            onChange={(e) => onUpdateAssignee(item.id, e.target.value)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md px-2 py-1 outline-none text-xs w-full transition-colors cursor-pointer border border-transparent hover:border-slate-300"
                          >
                            <option value="">Sin Asignar</option>
                            {safeUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <select
                            value={item.status || 'Not Started'}
                            onChange={(e) => onUpdateStatus(item.id, e.target.value)}
                            className={`w-full text-center font-semibold rounded-md py-1 px-2 text-xs transition-all cursor-pointer shadow-sm ${statusConfig.bg} ${statusConfig.text}`}
                          >
                            <option value="Not Started" className="bg-white text-slate-800">Por Hacer</option>
                            <option value="In Progress" className="bg-white text-slate-800">En Progreso</option>
                            <option value="Blocked" className="bg-white text-slate-800">🚨 Bloqueado</option>
                            <option value="Completed" className="bg-white text-slate-800">✓ Completado</option>
                          </select>
                        </td>

                        {/* Time Tracking Timer */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <button
                              onClick={() => toggleTimer(item.id, item.timerSeconds || 0)}
                              className={`p-1 rounded text-white transition-colors ${
                                itemTimer.running ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
                              }`}
                              title={itemTimer.running ? 'Pausar cronómetro' : 'Iniciar cronómetro de tarea'}
                            >
                              {itemTimer.running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            </button>
                            <span className={`font-mono text-xs font-bold ${itemTimer.running ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
                              {formatTimer(itemTimer.seconds)}
                            </span>
                          </div>
                        </td>

                        {/* Budget Amount */}
                        <td className="py-3 px-4">
                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-slate-400 font-bold">$</span>
                            <input
                              type="number"
                              value={currentBudget || ''}
                              onChange={(e) => setBudgets({ ...budgets, [item.id]: parseFloat(e.target.value) || 0 })}
                              onBlur={(e) => handleBudgetBlur(item.id, parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="w-full pl-5 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500"
                            />
                          </div>
                        </td>

                        {/* File Attachments */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setActiveFileModalItemId(item.id)}
                            className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors border border-slate-200"
                            title="Ver o adjuntar evidencias/archivos"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                            <span className="font-bold">{itemFiles.length}</span>
                          </button>
                        </td>

                        {/* Due Date & Outlook Sync */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-slate-600 font-medium">
                              {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Sin Fecha'}
                            </span>
                            <button
                              onClick={() => onSyncCalendar(item)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="Sincronizar con Outlook Calendar M365"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Add Item Form Row */}
                  <tr className="bg-slate-50/40">
                    <td colSpan={10} className="p-2">
                      <form onSubmit={(e) => handleCreateItemSubmit(group.id, e)} className="flex items-center space-x-2 px-2">
                        <Plus className="w-4 h-4 text-blue-600" />
                        <input
                          type="text"
                          placeholder="+ Agregar nuevo entregable / tarea a esta sección..."
                          value={newItemTitles[group.id] || ''}
                          onChange={(e) => setNewItemTitles({ ...newItemTitles, [group.id]: e.target.value })}
                          className="flex-1 bg-transparent border-none text-xs focus:outline-none placeholder-slate-400 text-slate-800 font-medium py-1"
                        />
                        {newItemTitles[group.id]?.trim() && (
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded shadow-sm transition-all"
                          >
                            Guardar
                          </button>
                        )}
                      </form>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Add New Group Button */}
      <div>
        {showAddGroup ? (
          <form onSubmit={handleCreateGroupSubmit} className="bg-white p-4 rounded-xl border border-blue-300 shadow-md flex items-center space-x-3 max-w-md">
            <input
              type="text"
              placeholder="Nombre de la nueva fase de proyecto..."
              value={newGroupTitle}
              onChange={(e) => setNewGroupTitle(e.target.value)}
              className="flex-1 border border-slate-300 rounded-md px-3 py-1.5 text-xs outline-none focus:border-blue-500 font-medium"
              autoFocus
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded shadow-sm"
            >
              Crear Fase
            </button>
            <button
              type="button"
              onClick={() => setShowAddGroup(false)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowAddGroup(true)}
            className="flex items-center space-x-2 bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Nueva Fase / Sección</span>
          </button>
        )}
      </div>

      {/* ITEM UPDATES & COMMENTS MODAL */}
      {activeCommentItemId && activeCommentItem && (
        <ItemUpdatesModal
          item={activeCommentItem}
          users={users}
          currentUser={currentUser}
          isOpen={!!activeCommentItemId}
          onClose={() => setActiveCommentItemId(null)}
          onRefreshBoard={onRefreshBoard}
        />
      )}

      {/* FILE ATTACHMENTS MODAL */}
      {activeFileModalItemId && activeItemForFiles && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                <Paperclip className="w-5 h-5 text-blue-600" />
                <span>Adjuntos y Evidencias de: {activeItemForFiles.title}</span>
              </h3>
              <button onClick={() => setActiveFileModalItemId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2.5 rounded-xl border border-blue-200 flex items-center justify-center space-x-2 transition-all"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Adjuntar Documento o Fotografía</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pt-2">
              {activeFileAttachments.length > 0 ? (
                activeFileAttachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center space-x-2 truncate pr-2">
                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{att.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <a
                        href={att.url}
                        download={att.name}
                        className="text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        Descargar
                      </a>
                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="text-slate-400 hover:text-red-600 p-0.5"
                        title="Eliminar archivo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  No hay evidencias adjuntas en este entregable.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveFileModalItemId(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-5 py-2 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
