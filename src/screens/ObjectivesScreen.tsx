import { useState } from 'react';
import { Plus, Target, Trash2, Edit2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface Objective {
  id: string;
  title: string;
  goal: string;
  deadline?: string;
  brand: string;
  campaignId?: string;
  status: 'not-started' | 'in-progress' | 'completed';
  createdAt: string;
}

export function ObjectivesScreen() {
  const campaigns = useAppStore((s) => s.campaigns);
  const [objectives, setObjectives] = useState<Objective[]>([
    {
      id: '1',
      title: 'Q3 Digital Marketing Campaign',
      goal: 'Increase website traffic by 30% and generate 5000 qualified leads',
      deadline: '2026-09-30',
      brand: 'mtech',
      status: 'in-progress',
      createdAt: '2026-07-24',
    },
    {
      id: '2',
      title: 'Brand Awareness Initiative',
      goal: 'Achieve 50% brand recognition in target market',
      deadline: '2026-12-31',
      brand: 'brentwood',
      status: 'not-started',
      createdAt: '2026-07-20',
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    goal: string;
    deadline: string;
    brand: string;
    campaignId: string;
    status: 'not-started' | 'in-progress' | 'completed';
  }>({
    title: '',
    goal: '',
    deadline: '',
    brand: 'mtech',
    campaignId: '',
    status: 'not-started',
  });

  const handleCreate = () => {
    if (!formData.title.trim() || !formData.goal.trim()) return;

    const newObjective: Objective = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
    };

    setObjectives([newObjective, ...objectives]);
    setFormData({
      title: '',
      goal: '',
      deadline: '',
      brand: 'mtech',
      campaignId: '',
      status: 'not-started',
    });
    setShowForm(false);
  };

  const handleUpdate = (id: string) => {
    setObjectives(
      objectives.map((obj) =>
        obj.id === id ? { ...obj, ...formData } : obj
      )
    );
    setEditingId(null);
    setFormData({
      title: '',
      goal: '',
      deadline: '',
      brand: 'mtech',
      campaignId: '',
      status: 'not-started',
    });
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
    });
    setShowForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBrandColor = (brand: string) => {
    const colors: Record<string, string> = {
      mtech: '#0D1B2A',
      brentwood: '#3B82F6',
      'radio-links': '#0F6E56',
      capcom: '#534AB7',
      ircl: '#1D9E75',
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
              setFormData({
                title: '',
                goal: '',
                deadline: '',
                brand: 'mtech',
                campaignId: '',
                status: 'not-started',
              });
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
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
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
                      <span className="text-sm text-slate-600">
                        📅 Due: {new Date(obj.deadline).toLocaleDateString()}
                      </span>
                    )}

                    {campaign && (
                      <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded">
                        Campaign: {campaign.name}
                      </span>
                    )}

                    <span className="text-xs text-slate-500">
                      Created {new Date(obj.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
