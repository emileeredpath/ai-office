import { useState } from 'react';
import { Plus, Target, Trash2, Edit2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface ObjectiveKPI {
  id: string;
  name: string;
  target: string;
  actual: string;
}

interface Objective {
  id: string;
  title: string;
  goal: string;
  deadline?: string;
  brand: string;
  campaignId?: string;
  status: 'planning' | 'not-started' | 'in-progress' | 'completed';
  budget?: number;
  kpis: ObjectiveKPI[];
  createdAt: string;
}

export function ObjectivesScreen() {
  const campaigns = useAppStore((s) => s.campaigns);
  const [objectives, setObjectives] = useState<Objective[]>([
    {
      id: 'obj-1',
      title: 'Q3 Education Campaign',
      goal: 'Generate 50 education sector enquiries for MTech Group by end of August 2026',
      deadline: '2026-08-31',
      brand: 'mtech',
      status: 'planning',
      budget: 8000,
      campaignId: undefined,
      kpis: [
        { id: 'kpi-1', name: 'Email open rate', target: '25%', actual: '' },
        { id: 'kpi-2', name: 'Email click rate', target: '3%', actual: '' },
        { id: 'kpi-3', name: 'Landing page visits', target: '500', actual: '' },
        { id: 'kpi-4', name: 'Enquiries generated', target: '50', actual: '' },
        { id: 'kpi-5', name: 'Quotes requested', target: '10', actual: '' },
      ],
      createdAt: '2026-07-27',
    },
  ]);

  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [resultsForm, setResultsForm] = useState<Record<string, string>>({});

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    goal: string;
    deadline: string;
    brand: string;
    campaignId: string;
    status: 'planning' | 'not-started' | 'in-progress' | 'completed';
    budget: string;
  }>({
    title: '',
    goal: '',
    deadline: '',
    brand: 'mtech',
    campaignId: '',
    status: 'not-started',
    budget: '',
  });

  const emptyFormData = {
    title: '',
    goal: '',
    deadline: '',
    brand: 'mtech',
    campaignId: '',
    status: 'not-started' as const,
    budget: '',
  };

  const handleCreate = () => {
    if (!formData.title.trim() || !formData.goal.trim()) return;

    const newObjective: Objective = {
      id: Date.now().toString(),
      title: formData.title,
      goal: formData.goal,
      deadline: formData.deadline,
      brand: formData.brand,
      campaignId: formData.campaignId,
      status: formData.status,
      budget: formData.budget ? Number(formData.budget) : undefined,
      kpis: [],
      createdAt: new Date().toISOString(),
    };

    setObjectives([newObjective, ...objectives]);
    setFormData(emptyFormData);
    setShowForm(false);
  };

  const handleUpdate = (id: string) => {
    setObjectives(
      objectives.map((obj) =>
        obj.id === id
          ? {
              ...obj,
              title: formData.title,
              goal: formData.goal,
              deadline: formData.deadline,
              brand: formData.brand,
              campaignId: formData.campaignId,
              status: formData.status,
              budget: formData.budget ? Number(formData.budget) : undefined,
            }
          : obj
      )
    );
    setEditingId(null);
    setFormData(emptyFormData);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this objective?')) return;
    setObjectives(objectives.filter((obj) => obj.id !== id));
  };

  const handleEdit = (objective: Objective) => {
    setEditingId(objective.id);
    setFormData({
      title: objective.title,
      goal: objective.goal,
      deadline: objective.deadline || '',
      brand: objective.brand as any,
      campaignId: objective.campaignId || '',
      status: objective.status,
      budget: objective.budget != null ? String(objective.budget) : '',
    });
    setShowForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'planning':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isDeadlinePassed = (obj: Objective) => {
    if (!obj.deadline) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(obj.deadline) < today;
  };

  const startLogging = (obj: Objective) => {
    const initial: Record<string, string> = {};
    obj.kpis.forEach((kpi) => {
      initial[kpi.id] = kpi.actual;
    });
    setResultsForm(initial);
    setLoggingId(obj.id);
  };

  const saveResults = (id: string) => {
    setObjectives(
      objectives.map((obj) =>
        obj.id === id
          ? {
              ...obj,
              kpis: obj.kpis.map((kpi) => ({
                ...kpi,
                actual: resultsForm[kpi.id] ?? kpi.actual,
              })),
            }
          : obj
      )
    );
    setLoggingId(null);
    setResultsForm({});
  };

  const getBrandColor = (brand: string) => {
    const colors: Record<string, string> = {
      mtech: '#0D1B2A',
      brentwood: '#3B82F6',
      'radio-links': '#0F6E56',
      capcom: '#534AB7',
      ircl: '#1D9E75',
      idaro: '#DB2777',
    };
    return colors[brand] || '#6B7280';
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-600" />
              Objectives
            </h1>
            <p className="text-slate-600 mt-1">Manage your business and marketing goals</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData(emptyFormData);
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            New Objective
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-2 border-blue-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingId ? 'Edit Objective' : 'Create Objective'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Q3 Marketing Initiative"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Goal / KPI</label>
                <textarea
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="What do you want to achieve?"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="mtech">MTech</option>
                    <option value="brentwood">Brentwood</option>
                    <option value="radio-links">Radio Links</option>
                    <option value="capcom">Capcom</option>
                    <option value="ircl">IRCL</option>
                    <option value="idaro">IDARO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Campaign (optional)</label>
                  <select
                    value={formData.campaignId}
                    onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">None</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="planning">Planning</option>
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Budget (£, optional)</label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 8000"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    if (editingId) {
                      handleUpdate(editingId);
                    } else {
                      handleCreate();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingId ? 'Update' : 'Create'} Objective
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {objectives.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-600 mb-2">No objectives yet</h3>
              <p className="text-slate-500">Create your first objective to get started</p>
            </div>
          ) : (
            objectives.map((obj) => {
              const campaign = obj.campaignId
                ? campaigns.find((c) => c.id === obj.campaignId)
                : null;

              return (
                <div
                  key={obj.id}
                  className="bg-white rounded-lg shadow-md p-6 border-l-4"
                  style={{ borderLeftColor: getBrandColor(obj.brand) }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900">{obj.title}</h3>
                      <p className="text-slate-600 mt-1">{obj.goal}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(obj)}
                        className="p-2 text-slate-500 hover:text-blue-600 transition"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(obj.id)}
                        className="p-2 text-slate-500 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center mt-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(obj.status)}`}>
                      {obj.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>

                    {obj.deadline && (
                      <span className={`text-sm ${isDeadlinePassed(obj) && obj.status !== 'completed' ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                        📅 Due: {new Date(obj.deadline).toLocaleDateString('en-GB')}
                      </span>
                    )}

                    {campaign && (
                      <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded">
                        Campaign: {campaign.name}
                      </span>
                    )}

                    {obj.budget != null && (
                      <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded">
                        Budget: {obj.budget.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })}
                      </span>
                    )}

                    <span className="text-xs text-slate-500">
                      Created {new Date(obj.createdAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>

                  {obj.kpis.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                      {obj.kpis.map((kpi) => (
                        <div key={kpi.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                          <p className="text-xs text-slate-500 mb-1">{kpi.name}</p>
                          <p className="text-sm font-semibold text-slate-900">
                            Target: {kpi.target}
                          </p>
                          <p className="text-sm text-slate-600">
                            Actual: {kpi.actual || '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {isDeadlinePassed(obj) && obj.kpis.length > 0 && loggingId !== obj.id && (
                    <button
                      onClick={() => startLogging(obj)}
                      className="mt-4 px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-900 transition"
                    >
                      Log actual results
                    </button>
                  )}

                  {loggingId === obj.id && (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <h4 className="text-sm font-semibold text-slate-900 mb-3">Log actual results</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                        {obj.kpis.map((kpi) => (
                          <div key={kpi.id}>
                            <label className="block text-xs text-slate-500 mb-1">{kpi.name}</label>
                            <input
                              type="text"
                              value={resultsForm[kpi.id] ?? ''}
                              onChange={(e) =>
                                setResultsForm({ ...resultsForm, [kpi.id]: e.target.value })
                              }
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder={kpi.target}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveResults(obj.id)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                        >
                          Save results
                        </button>
                        <button
                          onClick={() => {
                            setLoggingId(null);
                            setResultsForm({});
                          }}
                          className="px-4 py-2 bg-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-400 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
