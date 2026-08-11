import React, { useState } from 'react';
import { FileText, Send, CheckCircle2, X, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { Board, User } from '../../types';
import { api } from '../../services/api';

interface ProjectFormModalProps {
  board: Board;
  users: User[];
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onRefreshBoard: () => void;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  board,
  users = [],
  currentUser,
  isOpen,
  onClose,
  onRefreshBoard,
}) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Dirección General');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Media');
  const [budget, setBudget] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen || !board) return null;

  const groups = Array.isArray(board.groups) ? board.groups : [];
  const targetGroup = groups[0]; // Target first group (e.g. Fase 1: Planificación)

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetGroup || !currentUser) return;
    setSubmitting(true);

    try {
      // 1. Create item in target group
      const newItem = await api.createItem({
        title: `[Solicitud: ${department}] ${title.trim()}`,
        groupId: targetGroup.id,
        boardId: board.id,
        createdById: currentUser.id,
        assignedToId: assignedToId || undefined,
        dueDate: dueDate || undefined,
        status: 'Not Started',
      });

      if (newItem && newItem.id) {
        // 2. Persist priority and budget
        await api.updateItem(newItem.id, {
          priority,
          budget: parseFloat(budget) || 0,
        });

        setSubmittedSuccess(true);
        onRefreshBoard();
      }
    } catch (err) {
      alert('Error al enviar la solicitud de proyecto.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDepartment('Dirección General');
    setDescription('');
    setPriority('Media');
    setBudget('');
    setDueDate('');
    setAssignedToId('');
    setSubmittedSuccess(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-xl space-y-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Formulario de Requerimientos de Proyecto</h3>
              <p className="text-xs text-slate-500">Recepción web de solicitudes para el tablero '{board.title}'</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-lg">¡Solicitud Registrada con Éxito!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                La solicitud ha sido insertada automáticamente en el tablero <strong className="text-blue-600">'{board.title}'</strong> en la sección <strong className="text-slate-700">'{targetGroup?.title || 'Fase 1'}'</strong>.
              </p>
            </div>
            <div className="pt-4 flex justify-center space-x-3">
              <button
                onClick={resetForm}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all"
              >
                Enviar Otra Solicitud
              </button>
              <button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
              >
                Cerrar Formulario
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitForm} className="space-y-4 text-xs font-medium text-slate-700">
            <div>
              <label className="block font-bold mb-1 text-slate-800">Nombre de la Solicitud / Proyecto</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Implementación de nuevo software de facturación electrónica"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-600 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-800">Departamento / Área Solicitante</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-600 font-medium bg-white"
                >
                  <option value="Dirección General">Dirección General</option>
                  <option value="Tecnología & M365">Tecnología & M365</option>
                  <option value="Operaciones & Procesos">Operaciones & Procesos</option>
                  <option value="Finanzas & Contabilidad">Finanzas & Contabilidad</option>
                  <option value="Recursos Humanos">Recursos Humanos</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-800">Prioridad Estimada</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-600 font-bold bg-white"
                >
                  <option value="Crítica">🔴 Crítica (Urgente)</option>
                  <option value="Alta">🟠 Alta</option>
                  <option value="Media">🟡 Media</option>
                  <option value="Baja">🔵 Baja</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-800">Presupuesto Estimado ($ MXN)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Ej. 45000"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-800">Fecha Límite Deseada</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-800">Asignar Responsable del Proyecto (Opcional)</label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-600 font-medium bg-white"
              >
                <option value="">Sin Asignar</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="text-xs font-semibold text-slate-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Enviando Solicitud...' : 'Enviar Solicitud al Tablero'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
