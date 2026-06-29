import jsPDF from 'jspdf';
import Papa from 'papaparse';
import type { AnalyticsMetrics } from '@/hooks/useAnalytics';

export async function exportToPDF(metrics: AnalyticsMetrics, dateRange: { start: Date; end: Date }) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  doc.setFontSize(20);
  doc.text('MTech AI Office - Analytics Report', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;
  doc.setFontSize(10);
  doc.setTextColor(100);
  const dateStr = `${dateRange.start.toLocaleDateString()} — ${dateRange.end.toLocaleDateString()}`;
  doc.text(`Period: ${dateStr}`, pageWidth / 2, yPosition, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition + 5, { align: 'center' });

  yPosition += 20;
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text('Summary Metrics', 20, yPosition);

  yPosition += 10;
  doc.setFontSize(10);
  const summaryData = [
    [`Active Employees: ${metrics.activeCount}/${metrics.totalEmployees}`],
    [`Average Workload: ${metrics.averageWorkload}%`],
    [`Tasks Queued: ${metrics.queuedTasksTotal}`],
    [`Completion Rate: ${metrics.completionRate}%`],
  ];

  summaryData.forEach((line) => {
    doc.text(line[0], 25, yPosition);
    yPosition += 6;
  });

  yPosition += 10;
  doc.setFontSize(14);
  doc.text('Workload Distribution', 20, yPosition);

  yPosition += 8;
  doc.setFontSize(9);
  metrics.employeeMetrics.slice(0, 4).forEach((emp) => {
    const barWidth = (emp.workloadPercent / 100) * 100;
    doc.setFillColor(249, 112, 31);
    doc.rect(25, yPosition, barWidth, 4, 'F');
    doc.text(`${emp.name} (${emp.workloadPercent}%)`, 130, yPosition + 3);
    yPosition += 7;
  });

  yPosition += 10;
  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.text('Task Priority Breakdown', 20, yPosition);

  yPosition += 8;
  doc.setFontSize(10);
  const priorityData = metrics.tasksByPriority;
  doc.text(`High Priority: ${priorityData.high.done} completed, ${priorityData.high.pending} pending`, 25, yPosition);
  yPosition += 6;
  doc.text(`Medium Priority: ${priorityData.medium.done} completed, ${priorityData.medium.pending} pending`, 25, yPosition);
  yPosition += 6;
  doc.text(`Low Priority: ${priorityData.low.done} completed, ${priorityData.low.pending} pending`, 25, yPosition);

  yPosition += 15;
  doc.setFontSize(14);
  doc.text('Bottleneck Analysis', 20, yPosition);

  yPosition += 8;
  doc.setFontSize(10);
  if (metrics.overloadedEmployees.length > 0) {
    doc.text('🚨 Overloaded (>85%)', 25, yPosition);
    yPosition += 5;
    metrics.overloadedEmployees.forEach((emp) => {
      doc.text(`  ${emp.name} - ${emp.workloadPercent}%`, 30, yPosition);
      yPosition += 5;
    });
  }

  if (metrics.longQueues.length > 0) {
    doc.text('⚠️  Long Queues (>3 tasks)', 25, yPosition);
    yPosition += 5;
    metrics.longQueues.forEach((emp) => {
      doc.text(`  ${emp.name} - ${emp.taskQueue.length} tasks`, 30, yPosition);
      yPosition += 5;
    });
  }

  doc.save(`mtech-analytics-${dateRange.start.toISOString().split('T')[0]}-to-${dateRange.end.toISOString().split('T')[0]}.pdf`);
}

export async function exportToCSV(metrics: AnalyticsMetrics, dateRange: { start: Date; end: Date }) {
  const rows: string[][] = [
    ['MTech AI Office - Analytics Report'],
    [dateRange.start.toLocaleDateString(), 'to', dateRange.end.toLocaleDateString()],
    ['Generated:', new Date().toLocaleString()],
    [],
    ['Summary Metrics'],
    ['Active Employees', `${metrics.activeCount}/${metrics.totalEmployees}`],
    ['Average Workload', `${metrics.averageWorkload}%`],
    ['Tasks Queued', metrics.queuedTasksTotal.toString()],
    ['Completion Rate', `${metrics.completionRate}%`],
    ['Total Tasks', metrics.totalTasks.toString()],
    [],
    ['Employee Metrics'],
    ['Name', 'Status', 'Workload %', 'Completed', 'Queued', 'Completion Rate'],
  ];

  metrics.employeeMetrics.forEach((emp) => {
    rows.push([
      emp.name,
      emp.status,
      emp.workloadPercent.toString(),
      emp.completedCount.toString(),
      emp.queuedCount.toString(),
      `${emp.completionRate}%`,
    ]);
  });

  rows.push([]);
  rows.push(['Task Priority Breakdown']);
  rows.push(['Priority', 'Completed', 'Pending', 'Total']);
  rows.push(['High', metrics.tasksByPriority.high.done.toString(), metrics.tasksByPriority.high.pending.toString(), String(metrics.tasksByPriority.high.done + metrics.tasksByPriority.high.pending)]);
  rows.push(['Medium', metrics.tasksByPriority.medium.done.toString(), metrics.tasksByPriority.medium.pending.toString(), String(metrics.tasksByPriority.medium.done + metrics.tasksByPriority.medium.pending)]);
  rows.push(['Low', metrics.tasksByPriority.low.done.toString(), metrics.tasksByPriority.low.pending.toString(), String(metrics.tasksByPriority.low.done + metrics.tasksByPriority.low.pending)]);

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mtech-analytics-${dateRange.start.toISOString().split('T')[0]}-to-${dateRange.end.toISOString().split('T')[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}
