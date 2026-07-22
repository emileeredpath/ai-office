import { useAppStore } from '@/store/useAppStore';
import { formatDate } from '@/utils/dateUtils';

export function SettingsScreen() {
  const tasks = useAppStore((s) => s.tasks);
  const campaigns = useAppStore((s) => s.campaigns);

  const exportTasksAsCSV = () => {
    const csvHeaders = [
      'Task ID',
      'Title',
      'Brand',
      'Status',
      'Priority',
      'Deadline',
      'Campaign',
      'Notes',
      'Created At',
    ];

    const csvRows = tasks.map((task) => {
      const campaign = campaigns.find((c) => c.id === task.campaignId);
      return [
        task.id,
        `"${task.title.replace(/"/g, '""')}"`,
        task.brand,
        task.status,
        task.priority,
        task.deadline ? formatDate(task.deadline) : '',
        campaign?.name || '',
        `"${(task.notes || '').replace(/"/g, '""')}"`,
        formatDate(task.createdAt),
      ].join(',');
    });

    const csv = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `mtech-tasks-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Settings</h1>

        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Your name</label>
              <input type="text" value="Emilee" disabled className="input opacity-60" />
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">MTech AI Integration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                MTech AI Project Link
              </label>
              <input
                type="text"
                value="https://claude.ai/project/019ef9de-64f0-75c3-8a1e-67749db5192e"
                disabled
                className="input opacity-60 text-xs"
              />
              <p className="text-xs text-text-secondary mt-2">
                This link is used when you click "Open MTech AI" in task detail panels.
              </p>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Brand Colours</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: '#0D1B2A' }}></div>
                <span className="text-sm text-text-primary">MTech Navy</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: '#F97031' }}></div>
                <span className="text-sm text-text-primary">MTech Orange</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
                <span className="text-sm text-text-primary">Brentwood Blue</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: '#0F6E56' }}></div>
                <span className="text-sm text-text-primary">Radio Links Teal</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: '#534AB7' }}></div>
                <span className="text-sm text-text-primary">Capcom Purple</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: '#1D9E75' }}></div>
                <span className="text-sm text-text-primary">IRCL Green</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Data</h2>
          <button onClick={exportTasksAsCSV} className="btn btn-secondary">
            Export tasks as CSV
          </button>
        </div>
      </div>
    </div>
  );
}
