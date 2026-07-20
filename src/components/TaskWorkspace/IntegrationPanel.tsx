import { useState, useEffect } from 'react';
import * as api from '@/services/api';

interface IntegrationPanelProps {
  companyId: string;
  currentUserId: string;
}

export function IntegrationPanel({ companyId, currentUserId }: IntegrationPanelProps) {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'connections' | 'history' | 'alerts'>('connections');
  const [showConfigForm, setShowConfigForm] = useState<string | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string>('acumatica');

  const [formData, setFormData] = useState({
    apiKey: '',
    apiUrl: '',
    username: '',
    password: '',
    accessToken: '',
  });

  const SYSTEMS = [
    {
      id: 'acumatica',
      name: 'Acumatica ERP',
      icon: '📊',
      description: 'Sync vendors, invoices, and cost centers',
      fields: ['apiUrl', 'apiKey'],
    },
    {
      id: 'campaign_monitor',
      name: 'Campaign Monitor',
      icon: '✉️',
      description: 'Sync email campaigns and subscriber lists',
      fields: ['apiKey'],
    },
    {
      id: 'ga4',
      name: 'Google Analytics 4',
      icon: '📈',
      description: 'Sync traffic data and campaign performance',
      fields: ['accessToken'],
    },
  ];

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [integrationData, historyData, alertData] = await Promise.all([
        api.getIntegrations(companyId),
        api.getSyncHistory(companyId),
        api.getIntegrationAlerts(companyId, true),
      ]);
      setIntegrations(integrationData);
      setSyncHistory(historyData);
      setAlerts(alertData);
    } catch (error) {
      console.error('Failed to load integration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIntegration = async () => {
    if (!selectedSystem) {
      alert('Please select a system');
      return;
    }

    try {
      const system = SYSTEMS.find((s) => s.id === selectedSystem);
      if (!system) return;

      const configData = system.fields.reduce(
        (acc, field) => {
          if (formData[field as keyof typeof formData]) {
            acc[field] = formData[field as keyof typeof formData];
          }
          return acc;
        },
        {} as any
      );

      await api.saveIntegration(companyId, selectedSystem, configData);
      setFormData({ apiKey: '', apiUrl: '', username: '', password: '', accessToken: '' });
      setShowConfigForm(null);
      await loadData();
    } catch (error) {
      console.error('Failed to save integration:', error);
      alert('Failed to save integration');
    }
  };

  const getSystemIcon = (systemType: string) => {
    const system = SYSTEMS.find((s) => s.id === systemType);
    return system?.icon || '🔗';
  };

  const getSystemName = (systemType: string) => {
    const system = SYSTEMS.find((s) => s.id === systemType);
    return system?.name || systemType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-slate-400">Loading integrations...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 mb-2">External Integrations</h1>
        <p className="text-slate-400">Connect external systems for real-time data sync</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('connections')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'connections'
              ? 'text-orange-400 border-b-2 border-orange-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Connections
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-orange-400 border-b-2 border-orange-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Sync History
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'alerts'
              ? 'text-orange-400 border-b-2 border-orange-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Alerts ({alerts.length})
        </button>
      </div>

      {/* Connections Tab */}
      {activeTab === 'connections' && (
        <div className="space-y-6">
          {/* Add Connection Button */}
          <div>
            <button
              onClick={() => {
                setShowConfigForm(showConfigForm ? null : 'add');
                setSelectedSystem('acumatica');
              }}
              className="px-6 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors"
            >
              {showConfigForm === 'add' ? '✕ Cancel' : '+ Add Connection'}
            </button>
          </div>

          {/* Add Form */}
          {showConfigForm === 'add' && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-slate-50 mb-4">Connect External System</h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">System</label>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {SYSTEMS.map((system) => (
                    <button
                      key={system.id}
                      onClick={() => setSelectedSystem(system.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedSystem === system.id
                          ? 'border-orange-500 bg-orange-900/20'
                          : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-2xl mb-2">{system.icon}</div>
                      <p className="font-bold text-slate-50">{system.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{system.description}</p>
                    </button>
                  ))}
                </div>

                {/* Dynamic Fields */}
                <div className="space-y-4">
                  {selectedSystem &&
                    SYSTEMS.find((s) => s.id === selectedSystem)?.fields.map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-slate-300 mb-2 capitalize">
                          {field.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        {field === 'apiUrl' ? (
                          <input
                            type="url"
                            placeholder="https://api.example.com"
                            value={formData[field as keyof typeof formData]}
                            onChange={(e) =>
                              setFormData({ ...formData, [field]: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                          />
                        ) : (
                          <input
                            type={field.includes('password') ? 'password' : 'text'}
                            placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}`}
                            value={formData[field as keyof typeof formData]}
                            onChange={(e) =>
                              setFormData({ ...formData, [field]: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                          />
                        )}
                      </div>
                    ))}
                </div>

                <button
                  onClick={handleSaveIntegration}
                  className="mt-6 px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors w-full"
                >
                  Save Connection
                </button>
              </div>
            </div>
          )}

          {/* Existing Connections */}
          <div className="space-y-4">
            {integrations.length === 0 ? (
              <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
                <p className="text-slate-400">No integrations connected yet</p>
                <p className="text-slate-500 text-sm mt-2">
                  Connect your external systems to enable real-time data sync
                </p>
              </div>
            ) : (
              integrations.map((integration) => (
                <div key={integration.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{getSystemIcon(integration.system_type)}</span>
                      <div>
                        <h3 className="text-lg font-bold text-slate-50">
                          {getSystemName(integration.system_type)}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {integration.is_active ? '🟢 Active' : '🔴 Inactive'}
                        </p>
                      </div>
                    </div>
                    {integration.last_sync_at && (
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Last synced</p>
                        <p className="text-sm text-slate-300">
                          {new Date(integration.last_sync_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900/50 rounded p-3">
                    <p className="text-xs text-slate-400">
                      Status: <span className="text-slate-200">{integration.sync_status || 'idle'}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sync History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {syncHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No sync history yet</p>
            </div>
          ) : (
            syncHistory.map((sync) => (
              <div key={sync.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-50">
                      {getSystemName(sync.system_type)} - {sync.sync_type.toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(sync.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        sync.status === 'success'
                          ? 'bg-green-900/30 text-green-200'
                          : 'bg-red-900/30 text-red-200'
                      }`}
                    >
                      {sync.status}
                    </span>
                    <p className="text-xs text-slate-400 mt-2">{sync.records_processed} records</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No active alerts</p>
              <p className="text-slate-500 text-sm mt-2">All integrations are running smoothly</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg p-4 border-l-4 ${
                  alert.priority === 'critical'
                    ? 'bg-red-900/20 border-red-600'
                    : alert.priority === 'high'
                      ? 'bg-orange-900/20 border-orange-600'
                      : 'bg-yellow-900/20 border-yellow-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-slate-50">{alert.alert_type}</p>
                    <p className="text-sm text-slate-300 mt-1">{alert.message}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {getSystemName(alert.source_system)} •{' '}
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
