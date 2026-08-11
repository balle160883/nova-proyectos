import React, { useState } from 'react';
import { Zap, X, Plus, Check, Play, CheckCircle2, MessageSquare, Calendar, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { Automation, Board } from '../../types';
import { api } from '../../services/api';

interface AutomationEditorModalProps {
  board: Board;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const AutomationEditorModal: React.FC<AutomationEditorModalProps> = ({
  board,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'builder' | 'templates'>('rules');

  // Builder Form state
  const [ruleTitle, setRuleTitle] = useState('');
  const [triggerType, setTriggerType] = useState('ITEM_STATUS_CHANGED');
  const [conditionField, setConditionField] = useState('status');
  const [conditionOperator, setConditionOperator] = useState('equals');
  const [conditionValue, setConditionValue] = useState('Blocked');
  const [actionType, setActionType] = useState<'NOTIFY_TEAMS' | 'CREATE_OUTLOOK_EVENT' | 'SEND_EMAIL' | 'MOVE_ITEM_GROUP'>('NOTIFY_TEAMS');
  const [teamsChannel, setTeamsChannel] = useState('Canal General / Proyectos M365');
  const [teamsMessage, setTeamsMessage] = useState('🚨 La tarea se ha marcado como BLOQUEADA. Se requiere atención inmediata.');

  if (!isOpen) return null;

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = ruleTitle.trim() || `Cuando ${triggerType} (${conditionValue}) → ${actionType}`;

    const conditions = conditionValue
      ? [{ field: conditionField, operator: conditionOperator, value: conditionValue }]
      : [];

    let payload: any = {};
    if (actionType === 'NOTIFY_TEAMS') {
      payload = { channel: teamsChannel, message: teamsMessage };
    }

    const actions = [{ type: actionType, payload }];

    await api.createAutomation({
      title,
      boardId: board.id,
      triggerType,
      conditions,
      actions,
    });

    onRefresh();
    setActiveTab('rules');
    setRuleTitle('');
  };

  const handleToggle = async (id: string, isEnabled: boolean) => {
    await api.toggleAutomation(id, !isEnabled);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 select-none animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-yellow-500 rounded-xl flex items-center justify-center text-slate-900 shadow-md font-bold">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Motor de Automatizaciones (BullMQ & Events)</h2>
              <p className="text-xs text-slate-400">Reglas sin código y conectores nativos con Microsoft 365</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex space-x-2">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'rules' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Reglas Activas ({board.automations?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'builder' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            + Diseñar Nueva Regla
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
          {/* TAB 1: RULES LIST */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              {board.automations && board.automations.length > 0 ? (
                board.automations.map((rule) => (
                  <div key={rule.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Zap className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                        <h4 className="font-bold text-slate-800 text-sm">{rule.title}</h4>
                      </div>
                      <button
                        onClick={() => handleToggle(rule.id, rule.isEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                          rule.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                            rule.isEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        ></div>
                      </button>
                    </div>

                    {/* Rule Detail Pipeline */}
                    <div className="flex items-center space-x-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700">
                      <span className="font-semibold text-blue-600">CUANDO: {rule.triggerType}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-purple-600">SI CUMPLE: {rule.conditions || 'Cualquier condición'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-emerald-600">ENTONCES: {rule.actions}</span>
                    </div>

                    {/* Execution Logs */}
                    {rule.logs && rule.logs.length > 0 && (
                      <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Última ejecución: {new Date(rule.logs[0].executedAt).toLocaleString()} — Status: {rule.logs[0].status}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <Zap className="w-12 h-12 text-yellow-500 mx-auto opacity-50 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No hay reglas de automatización creadas</p>
                  <p className="text-xs text-slate-400 mt-1">Crea tu primera regla sin código para notificar en Teams o sync con Outlook.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VISUAL RULE BUILDER */}
          {activeTab === 'builder' && (
            <form onSubmit={handleCreateRule} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Nombre de la Automatización
                </label>
                <input
                  type="text"
                  placeholder="Ej: Notificar en Teams cuando la tarea esté Bloqueada"
                  value={ruleTitle}
                  onChange={(e) => setRuleTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                />
              </div>

              {/* Trigger Block */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                  <span>CUANDO (Disparador / Evento):</span>
                </div>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                >
                  <option value="ITEM_STATUS_CHANGED">Cambio de estatus de tarea (Ej. Bloqueado, Completado)</option>
                  <option value="ITEM_CREATED">Nueva tarea creada en el tablero</option>
                  <option value="ITEM_ASSIGNED">Nueva persona asignada a la tarea</option>
                </select>
              </div>

              {/* Condition Block */}
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 space-y-3">
                <div className="flex items-center space-x-2 text-purple-700 font-bold text-xs">
                  <span className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                  <span>SI CUMPLE LA CONDICIÓN:</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={conditionField}
                    onChange={(e) => setConditionField(e.target.value)}
                    className="bg-white border border-purple-300 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-800"
                  >
                    <option value="status">Estatus</option>
                    <option value="title">Título de tarea</option>
                  </select>

                  <select
                    value={conditionOperator}
                    onChange={(e) => setConditionOperator(e.target.value)}
                    className="bg-white border border-purple-300 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-800"
                  >
                    <option value="equals">es igual a</option>
                    <option value="contains">contiene</option>
                  </select>

                  <input
                    type="text"
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    className="bg-white border border-purple-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 outline-none"
                    placeholder="Valor (ej: Blocked)"
                  />
                </div>
              </div>

              {/* Action Block */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
                  <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px]">3</span>
                  <span>ENTONCES EJECUTAR ACCIÓN:</span>
                </div>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                >
                  <option value="NOTIFY_TEAMS">💬 Notificar en Microsoft Teams (Canal de Proyectos)</option>
                  <option value="CREATE_OUTLOOK_EVENT">📅 Crear evento recordatorio en Outlook Calendar</option>
                  <option value="SEND_EMAIL">📧 Enviar correo de alerta vía Outlook Mail</option>
                </select>

                {actionType === 'NOTIFY_TEAMS' && (
                  <div className="space-y-2 pt-2">
                    <input
                      type="text"
                      value={teamsChannel}
                      onChange={(e) => setTeamsChannel(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium"
                      placeholder="Canal de Teams"
                    />
                    <textarea
                      value={teamsMessage}
                      onChange={(e) => setTeamsMessage(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium h-16"
                      placeholder="Mensaje a publicar"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('rules')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2 rounded-lg shadow-md transition-all"
                >
                  Guardar y Activar Regla
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
