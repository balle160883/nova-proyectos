import { Board } from '../types';

/**
 * Export board tasks to CSV file compatible with Microsoft Excel (UTF-8 BOM encoded)
 */
export function exportBoardToCSV(board: Board) {
  if (!board) return;

  const headers = ['ID Tarea', 'Grupo', 'Título', 'Estatus', 'Prioridad', 'Asignado A', 'Fecha Límite', 'Presupuesto'];

  const rows: string[][] = [];

  const safeGroups = Array.isArray(board.groups) ? board.groups : [];
  safeGroups.forEach((group) => {
    const safeItems = Array.isArray(group.items) ? group.items : [];
    safeItems.forEach((item) => {
      rows.push([
        item.id,
        group.title || '',
        `"${(item.title || '').replace(/"/g, '""')}"`,
        item.status || 'Sin Estado',
        item.priority || 'Normal',
        item.assignedTo ? item.assignedTo.name : 'Sin Asignar',
        item.dueDate ? new Date(item.dueDate).toLocaleDateString('es-MX') : 'Sin Fecha',
        item.budget ? `$${item.budget.toFixed(2)}` : '$0.00',
      ]);
    });
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Reporte_${board.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate a printable executive PDF summary report for a board
 */
export function printBoardReport(board: Board) {
  if (!board) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const safeGroups = Array.isArray(board.groups) ? board.groups : [];
  let totalTasks = 0;
  let completedTasks = 0;

  safeGroups.forEach((g) => {
    const items = Array.isArray(g.items) ? g.items : [];
    totalTasks += items.length;
    completedTasks += items.filter((i) => i.status === 'Completed').length;
  });

  const completionPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte Ejecutivo — ${board.title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1e293b; background: #fff; }
        .header { border-b: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 22px; font-weight: 800; color: #1e293b; }
        .logo span { color: #2563eb; }
        .meta { font-size: 11px; color: #64748b; text-align: right; }
        .kpi-container { display: flex; gap: 15px; margin-bottom: 25px; }
        .kpi-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; background: #f8fafc; }
        .kpi-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .kpi-value { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px; }
        .group-title { font-size: 14px; font-weight: 700; color: #2563eb; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
        th { background: #f1f5f9; text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; font-weight: 700; color: #475569; }
        td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
        .status { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 12px; display: inline-block; }
        .status-completed { background: #dcfce7; color: #166534; }
        .status-progress { background: #fef3c7; color: #92400e; }
        .status-default { background: #e2e8f0; color: #475569; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Kore <span>Suite</span></div>
        <div class="meta">
          <strong>Reporte Ejecutivo de Proyecto</strong><br>
          Generado: ${new Date().toLocaleString('es-MX')}<br>
          Tablero: ${board.title}
        </div>
      </div>

      <div class="kpi-container">
        <div class="kpi-card">
          <div class="kpi-title">Total Tareas</div>
          <div class="kpi-value">${totalTasks}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Tareas Completadas</div>
          <div class="kpi-value">${completedTasks}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">% Avance General</div>
          <div class="kpi-value">${completionPct}%</div>
        </div>
      </div>

      ${safeGroups
        .map(
          (g) => `
        <div class="group-title">${g.title} (${(g.items || []).length} tareas)</div>
        <table>
          <thead>
            <tr>
              <th>Tarea / Entregable</th>
              <th>Estatus</th>
              <th>Prioridad</th>
              <th>Asignado A</th>
              <th>Fecha Límite</th>
            </tr>
          </thead>
          <tbody>
            ${(g.items || [])
              .map(
                (item) => `
              <tr>
                <td><strong>${item.title}</strong></td>
                <td>
                  <span class="status ${
                    item.status === 'Completed' ? 'status-completed' : item.status === 'In Progress' ? 'status-progress' : 'status-default'
                  }">
                    ${item.status || 'Not Started'}
                  </span>
                </td>
                <td>${item.priority || 'Media'}</td>
                <td>${item.assignedTo ? item.assignedTo.name : 'Sin Asignar'}</td>
                <td>${item.dueDate ? new Date(item.dueDate).toLocaleDateString('es-MX') : 'Sin Fecha'}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      `,
        )
        .join('')}

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
