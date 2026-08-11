import React, { useState } from 'react';
import { Target, Award, TrendingUp, Plus, CheckCircle2, AlertCircle, DollarSign, Users, X, Sparkles } from 'lucide-react';
import { Board, User } from '../../types';

interface OkrGoal {
  id: string;
  title: string;
  category: string;
  progress: number; // 0 - 100
  targetDate: string;
  budget: number;
  ownerName: string;
  ownerAvatar?: string;
  keyResults: Array<{ id: string; title: string; current: number; target: number; unit: string }>;
}

interface OkrsViewProps {
  boards: Board[];
  users: User[];
  currentUser: User | null;
}

const INITIAL_OKRS: OkrGoal[] = [
  {
    id: 'okr-1',
    title: 'Estrategia 1: Transformación Digital & Automatización M365',
    category: 'Tecnología & Innovación',
    progress: 85,
    targetDate: '2026-09-30',
    budget: 150000,
    ownerName: 'Ing. Ballesteros (SuperAdmin)',
    ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    keyResults: [
      { id: 'kr-1', title: 'Despliegue completo de la plataforma Kore Suite', current: 100, target: 100, unit: '%' },
      { id: 'kr-2', title: 'Sincronización de tareas con Outlook Calendar', current: 4, target: 5, unit: 'tableros' },
      { id: 'kr-3', title: 'Capacitación de personal en motor de automatizaciones', current: 18, target: 20, unit: 'usuarios' },
    ],
  },
  {
    id: 'okr-2',
    title: 'Estrategia 2: Eficiencia Presupuestal y Control Operativo Q3',
    category: 'Finanzas & Operaciones',
    progress: 65,
    targetDate: '2026-10-15',
    budget: 280000,
    ownerName: 'Lic. Carlos Mendoza',
    ownerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
    keyResults: [
      { id: 'kr-4', title: 'Reducción de tiempos de entrega en proyectos corporativos', current: 25, target: 30, unit: '%' },
      { id: 'kr-5', title: 'Auditorías de presupuestos asignados por fase', current: 8, target: 10, unit: 'fases' },
    ],
  },
  {
    id: 'okr-3',
    title: 'Estrategia 3: Calidad y Entrega a Tiempo de Entregables',
    category: 'Gestión de Proyectos',
    progress: 92,
    targetDate: '2026-12-31',
    budget: 95000,
    ownerName: 'Ing. Sofía Rodríguez',
    ownerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
    keyResults: [
      { id: 'kr-6', title: 'Tasa de satisfacción en entregables ejecutivos', current: 95, target: 100, unit: '%' },
      { id: 'kr-7', title: 'Resolución de riesgos y entregables bloqueados en <24h', current: 9, target: 10, unit: 'incidentes' },
    ],
  },
];

export const OkrsView: React.FC<OkrsViewProps> = ({ boards = [], users = [], currentUser }) => {
  const [goals, setGoals] = useState<OkrGoal[]>(INITIAL_OKRS);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Gestión de Proyectos');
  const [targetDate, setTargetDate] = useState('');
  const [budget, setBudget] = useState('');
  const [krTitle, setKrTitle] = useState('');
  const [krTarget, setKrTarget] = useState('100');

  const handleCreateOkrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentUser) return;

    const newGoal: OkrGoal = {
      id: `okr-${Date.now()}`,
      title: title.trim(),
      category,
      progress: 10,
      targetDate: targetDate || '2026-12-31',
      budget: parseFloat(budget) || 0,
      ownerName: currentUser.name,
      ownerAvatar: currentUser.avatarUrl,
      keyResults: [
        {
          id: `kr-${Date.now()}`,
          title: krTitle.trim() || 'Resultado clave inicial',
          current: 10,
          target: parseFloat(krTarget) || 100,
          unit: '%',
        },
      ],
    };

    setGoals([newGoal, ...goals]);
    setTitle('');
    setCategory('Gestión de Proyectos');
    setTargetDate('');
    setBudget('');
    setKrTitle('');
    setKrTarget('100');
    setShowCreateModal(false);
  };

  const avgProgress = Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / (goals.length || 1));
  const totalOkrBudget = goals.reduce((sum, g) => sum + g.budget, 0);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50 select-none">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel de Objetivos & OKRs Estratégicos</h1>
            <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-purple-300">
              Kore Alignment
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Alineación estratégica de metas corporativas, resultados clave (KRs) y rendimiento de proyectos.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Crear Nuevo Objetivo Estratégico</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Cumplimiento Global OKRs</span>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">{avgProgress}%</div>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
            <Target className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Metas Estratégicas Activas</span>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">{goals.length} Estrategias</div>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Presupuesto OKR Asignado</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">${totalOkrBudget.toLocaleString()} MXN</div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* OKRs Goals Cards List */}
      <div className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            {/* Header Goal */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {goal.category}
                </span>
                <h3 className="font-bold text-slate-800 text-base mt-1">{goal.title}</h3>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <img src={goal.ownerAvatar} alt={goal.ownerName} className="w-6 h-6 rounded-full object-cover" />
                  <span className="font-semibold text-slate-700">{goal.ownerName}</span>
                </div>
                <span className="font-mono text-slate-500 font-medium">Meta: {new Date(goal.targetDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Progreso Estratégico</span>
                <span className="text-blue-600">{goal.progress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Key Results Breakdown List */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-tight block">Resultados Clave (Key Results):</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {goal.keyResults.map((kr) => {
                  const krPct = Math.round((kr.current / kr.target) * 100);
                  return (
                    <div key={kr.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="font-semibold text-xs text-slate-800 truncate" title={kr.title}>
                        {kr.title}
                      </div>
                      <div className="flex justify-between text-[11px] font-mono font-bold text-slate-600">
                        <span>
                          {kr.current} / {kr.target} {kr.unit}
                        </span>
                        <span className="text-emerald-600">{krPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(krPct, 100)}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE OKR MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateOkrSubmit} className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span>Crear Nuevo Objetivo Estratégico (OKR)</span>
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Título del Objetivo Estratégico</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Estrategia 4: Expansión y Eficiencia Operativa Q4"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Categoría / Área</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="Gestión de Proyectos">Gestión de Proyectos</option>
                <option value="Tecnología & Innovación">Tecnología & Innovación</option>
                <option value="Finanzas & Operaciones">Finanzas & Operaciones</option>
                <option value="Calidad Corporativa">Calidad Corporativa</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Presupuesto ($ MXN)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="120000"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Meta</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Resultado Clave Inicial (Key Result)</label>
              <input
                type="text"
                value={krTitle}
                onChange={(e) => setKrTitle(e.target.value)}
                placeholder="Ej. Cumplimiento de entregables en tiempo"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-xs font-semibold text-slate-500">
                Cancelar
              </button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-lg">
                Guardar OKR
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
