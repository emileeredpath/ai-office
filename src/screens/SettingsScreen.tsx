import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatDate } from '@/utils/dateUtils';
import { getApiUrl, setApiUrl, getApiKey, setApiKey, isActionsApiConfigured, checkHealth } from '@/services/actionsApi';

const LAST_CONNECTED_KEY = 'ai-office-actions-last-connected';

function ClaudeActionsSettings() {
  const apiConnected = useAppStore((s) => s.apiConnected);
  const apiSyncing = useAppStore((s) => s.apiSyncing);
  const syncTasksFromApi = useAppStore((s) => s.syncTasksFromApi);

  const [urlInput, setUrlInput] = useState(getApiUrl());
  const [keyInput, setKeyInput] = useState(getApiKey());
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [lastConnected, setLastConnected] = useState(localStorage.getItem(LAST_CONNECTED_KEY));

  const configured = isActionsApiConfigured();

  const handleSave = async () => {
    setApiUrl(urlInput);
    setApiKey(keyInput);
    setTestResult('idle');
    await syncTasksFromApi();
  };

  const handleTestConnection = async () => {
    setApiUrl(urlInput);
    setApiKey(keyInput);
    setTestResult('testing');

    const healthy = await checkHealth();
    if (!healthy) {
      setTestResult('fail');
      setTestMessage('Could not reach that URL. Check it\'s correct and the backend is running.');
      return;
    }

    await syncTasksFromApi();
    if (useAppStore.getState().apiConnected) {
      setTestResult('ok');
      setTestMessage('Connected — your API key works and tasks are syncing.');
      const now = new Date().toISOString();
      localStorage.setItem(LAST_CONNECTED_KEY, now);
      setLastConnected(now);
    } else {
      setTestResult('fail');
      setTestMessage('The server responded, but the API key was rejected. Double-check it.');
    }
  };

  const handleRevoke = () => {
    if (!window.confirm('Remove the stored API key from this browser? You can add it again later.')) return;
    setApiKey('');
    setKeyInput('');
    setTestResult('idle');
  };

  const statusLabel = !configured ? 'Not connected' : apiConnected ? 'Connected' : 'Connected, but last sync failed';
  const statusColor = !configured ? '#9ca3af' : apiConnected ? '#16a34a' : '#dc2626';

  return (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold text-text-primary mb-1">Claude Actions Integration</h2>
      <p className="text-xs text-text-secondary mb-4">
        This is different from the MTech AI link above — when connected, Claude can create, update
        and complete tasks directly in AI Office (subject to the confirmation rules built into the
        backend), and the dashboard itself reads and writes through the same connection.
      </p>

      <div className="flex items-center gap-2 mb-4">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColor }}></span>
        <span className="text-sm font-medium text-text-primary">{statusLabel}</span>
        {apiSyncing && <span className="text-xs text-text-secondary">(syncing…)</span>}
        {lastConnected && (
          <span className="text-xs text-text-secondary ml-2">
            Last successful connection: {formatDate(new Date(lastConnected))}
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Backend URL</label>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="input text-xs"
            placeholder="https://your-backend.up.railway.app"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">API Key</label>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            className="input text-xs"
            placeholder="Paste the API_KEY you set in Railway"
          />
          <p className="text-xs text-text-secondary mt-2">
            Stored only in this browser. It's never included in the app's code, and revoking it here
            only removes it from this browser — to fully revoke access, change the API_KEY variable in
            Railway too.
          </p>
        </div>

        {testResult !== 'idle' && (
          <p className={`text-sm ${testResult === 'ok' ? 'text-success' : testResult === 'fail' ? 'text-danger' : 'text-text-secondary'}`}>
            {testResult === 'testing' ? 'Testing connection…' : testMessage}
          </p>
        )}

        <div className="flex gap-3 flex-wrap">
          <button onClick={handleSave} className="btn btn-primary">
            Save
          </button>
          <button onClick={handleTestConnection} className="btn btn-secondary" disabled={testResult === 'testing'}>
            Test connection
          </button>
          {configured && (
            <button onClick={handleRevoke} className="btn btn-secondary">
              Revoke connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
                This link is used when you click "Open MTech AI" in task detail panels. It opens a
                separate Claude conversation — it does not read or write your AI Office data
                automatically. Anything you discuss there has to be added back into AI Office manually.
              </p>
            </div>
          </div>
        </div>

        <ClaudeActionsSettings />

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
