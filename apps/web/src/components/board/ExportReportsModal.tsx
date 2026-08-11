import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, X, CheckCircle2, AlertCircle, Clock, DollarSign, PieChart, BarChart3 } from 'lucide-react';
import { Board, User } from '../../types';

interface ExportReportsModalProps {
  board: Board;
  users: User[];
  isOpen: boolean;
  onClose: () => void;
}

export const ExportReportsModal: React.FC<ExportReportsModalProps> = ({ board, users = [], isOpen, onClose }) => {
  if (!isOpen || !board) return null;

  const groups = Array.isArray(board.groups) ? board.groups : [];
  const allItems = groups.flatMap((g) => (Array.isArray(g.items) ? g.items : []));

  const totalItems = allItems.length;
  const completedItems = allItems.filter((i) => i.status === 'Completed').length;
  const inProgressItems = allItems.filter((i) => i.status === 'In Progress').length;
  const blockedItems = allItems.filter((i) => i.status === 'Blocked').length;
  const notStartedItems = allItems.filter((i) => !i.status || i.status === 'Not Started').length;

  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const totalBudget = allItems.reduce((sum, i) => sum + (i.budget || 0), 0);

  // Generate and download CSV / Excel file
  const handleExportCSV = () => {
    const headers = ['ID', 'Fase / Grupo', 'Tarea / Entregable', 'Prioridad', 'Responsable', 'Estatus', 'Presupuesto MXN', 'Fecha Límite'];

    const rows = allItems.map((item, idx) => {
      const groupName = groups.find((g) => g.items?.some((gi) => gi.id === item.id))?.title || 'General';
      const assigneeName = users.find((u) => u.id === item.assignedToId)?.name || 'Sin Asignar';
      const dueDate = item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A';

      return [
        idx + 1,
        `"${groupName.replace(/"/g, '""')}"`,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.priority || 'Media'}"`,
        `"${assigneeName.replace(/"/g, '""')}"`,
        `"${item.status || 'Not Started'}"`,
        item.budget || 0,
        `"${dueDate}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_KoreSuite_${board.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print executive PDF report window
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte Ejecutivo — ${board.title}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; pb: 15px; margin-bottom: 20px; }
            .logo { font-size: 20px; font-weight: bold; color: #2563eb; }
            .title { font-size: 22px; font-weight: bold; margin-bottom: 5px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
            .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; text-align: center; }
            .stat-val { font-size: 20px; font-weight: bold; color: #0f172a; }
            .stat-lbl { font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 11px; color: #475569; border-bottom: 2px solid #cbd5e1; }
            td { padding: 10px; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
            .status-tag { padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; }
            .status-Completed { background: #dcfce7; color: #15803d; }
            .status-InProgress { background: #dbeafe; color: #1d4ed8; }
            .status-Blocked { background: #fee2e2; color: #b91c1c; }
            .status-NotStarted { background: #f1f5f9; color: #475569; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; pt: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">Kore Suite Enterprise</div>
              <div style="font-size:12px; color:#64748b;">Plataforma de Coordinación de Proyectos</div>
            </div>
            <div style="text-align:right; font-size:11px; color:#64748b;">
              <div>Fecha del Reporte: ${new Date().toLocaleDateString()}</div>
              <div>Generado por: ${board.createdBy?.name || 'Sistema'}</div>
            </div>
          </div>

          <div class="title">${board.title}</div>
          <p style="font-size:12px; color:#64748b; margin-top:0;">${board.description || 'Reporte de avance y entregables corporativos'}</p>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-val">${completionPercentage}%</div>
              <div class="stat-lbl">Tasa de Finalización</div>
            </div>
            <div class="stat-card">
              <div class="stat-val">${completedItems} / ${totalItems}</div>
              <div class="stat-lbl">Tareas Entregadas</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #b91c1c;">${blockedItems}</div>
              <div class="stat-lbl">Riesgos / Bloqueados</div>
            </div>
            <div class="stat-card">
              <div class="stat-val" style="color: #15803d;">$${totalBudget.toLocaleString()} MXN</div>
              <div class="stat-lbl">Presupuesto Ejecutado</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Fase / Grupo</th>
                <th>Tarea / Entregable</th>
                <th>Prioridad</th>
                <th>Responsable</th>
                <th>Estatus</th>
                <th>Presupuesto</th>
              </tr>
            </thead>
            <tbody>
              ${allItems
                .map((item, i) => {
                  const groupName = groups.find((g) => g.items?.some((gi) => gi.id === item.id))?.title || 'General';
                  const assigneeName = users.find((u) => u.id === item.assignedToId)?.name || 'Sin Asignar';
                  const stClass = item.status === 'In Progress' ? 'InProgress' : item.status || 'NotStarted';

                  return `
                  <tr>
                    <td>${i + 1}</td>
                    <td><b>${groupName}</b></td>
                    <td>${item.title}</td>
                    <td>${item.priority || 'Media'}</td>
                    <td>${assigneeName}</td>
                    <td><span class="status-tag status-${stClass}">${item.status || 'Not Started'}</span></td>
                    <td>$${(item.budget || 0).toLocaleString()} MXN</td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>

          <div class="footer">
            Reporte generado automáticamente por Kore Suite Plataforma M365. Documento confidencial corporativo.
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-xl space-y-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Reportes Ejecutivos & Exportación</h3>
              <p className="text-xs text-slate-500">Descarga de tableros a Excel/CSV e impresión de reportes en PDF</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-center">
            <div className="text-lg font-extrabold text-blue-700">{completionPercentage}%</div>
            <div className="text-[10px] font-bold text-blue-900 uppercase tracking-tight mt-0.5">Avance Global</div>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center">
            <div className="text-lg font-extrabold text-emerald-700">{completedItems} / {totalItems}</div>
            <div className="text-[10px] font-bold text-emerald-900 uppercase tracking-tight mt-0.5">Completados</div>
          </div>

          <div className="p-3 bg-red-50/70 border border-red-200 rounded-2xl text-center">
            <div className="text-lg font-extrabold text-red-700">{blockedItems}</div>
            <div className="text-[10px] font-bold text-red-900 uppercase tracking-tight mt-0.5">Bloqueados</div>
          </div>

          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl text-center">
            <div className="text-lg font-extrabold text-purple-700">${totalBudget.toLocaleString()}</div>
            <div className="text-[10px] font-bold text-purple-900 uppercase tracking-tight mt-0.5">Presupuesto</div>
          </div>
        </div>

        {/* Download Actions Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleExportCSV}
            className="w-full p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center justify-between shadow-lg transition-all transform active:scale-98"
          >
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-5 h-5 text-white" />
              <div className="text-left">
                <div className="text-sm">Exportar Tablero a Excel (.CSV)</div>
                <div className="text-[11px] text-emerald-100 font-normal">Descarga todas las tareas, responsables, estatus y presupuestos</div>
              </div>
            </div>
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={handlePrintPDF}
            className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-between shadow-lg transition-all transform active:scale-98"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-white" />
              <div className="text-left">
                <div className="text-sm">Generar Reporte Ejecutivo PDF</div>
                <div className="text-[11px] text-blue-100 font-normal">Formato imprimible de presentación para directivos y comités</div>
              </div>
            </div>
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button onClick={onClose} className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-5 py-2 rounded-xl">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
