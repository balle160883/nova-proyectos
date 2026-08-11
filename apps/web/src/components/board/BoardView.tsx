import React, { useState } from 'react';
import { Table, Kanban, Calendar, Clock, Zap, Plus, Filter, Search, Share2, Edit3, Trash2, X, BarChart3, Download, FileText } from 'lucide-react';
import { Board, User, Item } from '../../types';
import { TableView } from './TableView';
import { KanbanView } from './KanbanView';
import { GanttView } from './GanttView';
import { ExportReportsModal } from './ExportReportsModal';
import { ProjectFormModal } from './ProjectFormModal';

interface BoardViewProps {
  board: Board;
  users: User[];
  currentUser: User | null;
  onUpdateStatus: (itemId: string, newStatus: string) => void;
  onUpdateAssignee: (itemId: string, userId: string) => void;
  onAddItem: (groupId: string, title: string) => void;
  onAddGroup: (title: string) => void;
  onSyncCalendar: (item: Item) => void;
  onDeleteItem: (itemId: string) => void;
  onOpenAutomations: () => void;
  onEditBoard: (boardId: string, title: string, description: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onRefreshBoard?: () => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  board,
  users = [],
  currentUser,
  onUpdateStatus,
  onUpdateAssignee,
  onAddItem,
  onAddGroup,
  onSyncCalendar,
  onDeleteItem,
  onOpenAutomations,
  onEditBoard,
  onDeleteBoard,
  onRefreshBoard = () => {},
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'table' | 'kanban' | 'gantt' | 'calendar'>('table');
  const [showEditBoardModal, setShowEditBoardModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editTitle, setEditTitle] = useState(board?.title || '');
  const [editDescription, setEditDescription] = useState(board?.description || '');

  const isSuperAdmin = currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'ADMIN';

  const handleEditBoardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim() && board?.id) {
      onEditBoard(board.id, editTitle.trim(), editDescription.trim());
      setShowEditBoardModal(false);
    }
  };

  const handleDeleteBoardClick = () => {
    if (!board?.id) return;
    if (confirm(`¿Estás seguro de eliminar el tablero '${board.title}'? Esta acción eliminará permanentemente todas sus tareas, grupos y automatizaciones.`)) {
      onDeleteBoard(board.id);
    }
  };

  const groups = Array.isArray(board?.groups) ? board.groups : [];
  const calendarItems = groups.flatMap((g) => (Array.isArray(g?.items) ? g.items : [])).filter((i) => i?.dueDate);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto bg-slate-50 p-6 select-none">
      {/* Board Title Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{board?.title || 'Tablero de Trabajo'}</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-medium border border-emerald-300">
              Sincronizado M365
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{board?.description || 'Sin descripción'}</p>
        </div>

        {/* Top Right Action Bar */}
        <div className="flex items-center space-x-3">
          {/* Public Project Request Form Button */}
          <button
            onClick={() => setShowFormModal(true)}
            className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs px-3.5 py-2 rounded-xl border border-blue-300 shadow-sm transition-all"
            title="Formulario Web de Solicitud e Ingreso de Proyectos"
          >
            <FileText className="w-4 h-4 text-blue-700" />
            <span>Formulario Web</span>
          </button>

          {/* Reports & Export Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs px-3.5 py-2 rounded-xl border border-emerald-300 shadow-sm transition-all"
            title="Exportar a Excel / CSV y generar reporte en PDF"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Reportes & Exportar</span>
          </button>

          {/* Edit Board Button */}
          <button
            onClick={() => {
              setEditTitle(board?.title || '');
              setEditDescription(board?.description || '');
              setShowEditBoardModal(true);
            }}
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs px-3 py-2 rounded-xl border border-slate-300 shadow-sm transition-all"
            title="Editar nombre o descripción del tablero"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
            <span>Editar Tablero</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={handleDeleteBoardClick}
              className="flex items-center space-x-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs px-3 py-2 rounded-xl border border-red-200 shadow-sm transition-all"
              title="Eliminar tablero completo"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Eliminar Tablero</span>
            </button>
          )}

          <button
            onClick={onOpenAutomations}
            className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md transition-all transform active:scale-95"
          >
            <Zap className="w-4 h-4 fill-current text-white animate-pulse" />
            <span>Motor Automatizaciones ({board?.automations?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Sub Tab View Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 mb-6 bg-white px-3 py-1 rounded-xl border shadow-sm">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveSubTab('table')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'table'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Vista Tabla</span>
          </button>

          <button
            onClick={() => setActiveSubTab('kanban')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'kanban'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Kanban className="w-4 h-4" />
            <span>Vista Kanban</span>
          </button>

          <button
            onClick={() => setActiveSubTab('gantt')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'gantt'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Diagrama de Gantt</span>
          </button>

          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === 'calendar'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Outlook Calendar</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Filter className="w-4 h-4" />
          <span>Filtrar por responsable</span>
        </div>
      </div>

      {/* Render Active View */}
      {activeSubTab === 'table' && (
        <TableView
          board={board}
          users={users}
          currentUser={currentUser}
          onUpdateStatus={onUpdateStatus}
          onUpdateAssignee={onUpdateAssignee}
          onAddItem={onAddItem}
          onAddGroup={onAddGroup}
          onSyncCalendar={onSyncCalendar}
          onDeleteItem={onDeleteItem}
          onRefreshBoard={onRefreshBoard}
        />
      )}

      {activeSubTab === 'kanban' && (
        <KanbanView
          board={board}
          users={users}
          onUpdateStatus={onUpdateStatus}
        />
      )}

      {activeSubTab === 'gantt' && (
        <GanttView
          board={board}
          users={users}
          onUpdateStatus={onUpdateStatus}
        />
      )}

      {activeSubTab === 'calendar' && (
        <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-4">
          <Calendar className="w-12 h-12 text-blue-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Vista Calendario de Outlook (Microsoft Graph API)</h3>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            Todas las tareas con fecha límite asignada están sincronizadas en tiempo real con Microsoft Outlook Calendar de tu organización.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto pt-4">
            {calendarItems.map((item) => (
              <div key={item.id} className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
                <div className="font-semibold text-xs text-slate-800">{item.title}</div>
                <div className="text-[11px] text-blue-700 mt-1 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(item.dueDate!).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROJECT INTAKE FORM MODAL */}
      {showFormModal && (
        <ProjectFormModal
          board={board}
          users={users}
          currentUser={currentUser}
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          onRefreshBoard={onRefreshBoard}
        />
      )}

      {/* EXPORT & REPORTS MODAL */}
      {showExportModal && (
        <ExportReportsModal
          board={board}
          users={users}
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* EDIT BOARD MODAL */}
      {showEditBoardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleEditBoardSubmit} className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Editar Tablero</span>
              </h3>
              <button type="button" onClick={() => setShowEditBoardModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Tablero</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-blue-500 h-20"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowEditBoardModal(false)} className="text-xs font-semibold text-slate-500">
                Cancelar
              </button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-lg">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
