import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, Plus, ArrowRight, UserCheck, CheckSquare, RefreshCw } from 'lucide-react';
import { Meeting, Board, User } from '../../types';
import { api } from '../../services/api';

interface MeetingsViewProps {
  board: Board;
  users: User[];
  onRefreshBoard: () => void;
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({ board, users, onRefreshBoard }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newActionItemText, setNewActionItemText] = useState('');
  const [actionItemsList, setActionItemsList] = useState<string[]>([]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const data = await api.getMeetings(board.id);
      setMeetings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [board.id]);

  const handleAddActionItem = () => {
    if (newActionItemText.trim()) {
      setActionItemsList([...actionItemsList, newActionItemText.trim()]);
      setNewActionItemText('');
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await api.createMeeting({
      title: newTitle.trim(),
      boardId: board.id,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      summary: newSummary,
      actionItems: actionItemsList,
    });

    setNewTitle('');
    setNewSummary('');
    setActionItemsList([]);
    setShowNewMeeting(false);
    fetchMeetings();
  };

  const handleConvertActionItem = async (actionItemId: string, assigneeId?: string) => {
    const targetGroup = board.groups[0]?.id;
    if (!targetGroup) return;

    const creatorId = users[0]?.id || 'system-user';

    await api.convertActionItemToTask(actionItemId, {
      groupId: targetGroup,
      createdById: creatorId,
      assigneeId,
    });

    fetchMeetings();
    onRefreshBoard();
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Juntas & Minutas M365 (Outlook Linked)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Agendas sincronizadas con Outlook Calendar y conversión directa de acuerdos en tareas del tablero.
          </p>
        </div>
        <button
          onClick={() => setShowNewMeeting(!showNewMeeting)}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Registrar Nueva Junta</span>
        </button>
      </div>

      {/* New Meeting Form */}
      {showNewMeeting && (
        <form onSubmit={handleCreateMeeting} className="bg-white p-6 rounded-2xl border border-purple-200 shadow-lg space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Registrar Minuta de Junta M365</h3>
          <input
            type="text"
            placeholder="Título de la reunión (ej: Sincronización Semanal de Avance)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-purple-500"
            required
          />
          <textarea
            placeholder="Resumen / Minuta de la sesión..."
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-purple-500 h-20"
          />

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Acuerdos / Compromisos de la Junta:</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Agregar un acuerdo clave..."
                value={newActionItemText}
                onChange={(e) => setNewActionItemText(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium"
              />
              <button
                type="button"
                onClick={handleAddActionItem}
                className="bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                + Acuerdo
              </button>
            </div>
            {actionItemsList.length > 0 && (
              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                {actionItemsList.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowNewMeeting(false)}
              className="text-xs font-semibold text-slate-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-2 rounded-lg"
            >
              Guardar Minuta & Sincronizar Outlook
            </button>
          </div>
        </form>
      )}

      {/* Meetings List */}
      <div className="space-y-4">
        {meetings.map((m) => (
          <div key={m.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <h3 className="font-bold text-slate-800 text-base">{m.title}</h3>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(m.startTime).toLocaleString()}</span>
                  </span>
                  <span>• Evento Outlook ID: {m.calendarEventId}</span>
                </div>
              </div>
            </div>

            {m.summary && <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{m.summary}</p>}

            {/* Action Items to Tasks Converter */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-slate-700 text-xs flex items-center space-x-1.5">
                <CheckSquare className="w-4 h-4 text-purple-600" />
                <span>Acuerdos de la Junta — Conversión Directa a Tareas:</span>
              </h4>

              <div className="space-y-2">
                {m.actionItems.map((ai) => (
                  <div
                    key={ai.id}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${ai.isConverted ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                      <span className={`font-medium ${ai.isConverted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {ai.text}
                      </span>
                    </div>

                    {ai.isConverted ? (
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
                        ✓ Convertido a Tarea
                      </span>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleConvertActionItem(ai.id, users[0]?.id)}
                          className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] px-3 py-1 rounded-lg shadow-sm transition-all"
                        >
                          <span>Convertir en Tarea</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
