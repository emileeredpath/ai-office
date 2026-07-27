import { useState } from 'react';
import { Plus, Brain, TrendingUp, Zap } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Objective {
  id: string;
  title: string;
  description: string;
  brand: string;
  targetAudience: string;
  kpis: string[];
  timeframe: string;
  budget?: number;
  createdAt: string;
}

interface Dashboard {
  title: string;
  strategy: string;
  tactics: string[];
  metrics: Record<string, string>;
}

export function MarketingOSScreen() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAudience: '',
    kpis: '',
    timeframe: '',
    budget: '',
    marketAnalysis: '',
    competitors: '',
  });

  const [taskTitle, setTaskTitle] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);

  const handleCreateObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/marketingos/objectives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: 'mtech',
          title: formData.title,
          description: formData.description,
          targetAudience: formData.targetAudience,
          kpis: formData.kpis.split('\n').filter(k => k.trim()),
          timeframe: formData.timeframe,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
        }),
      });

      const data = await response.json() as any;
      if (data.result) {
        setObjectives([data.result, ...objectives]);
        setFormData({
          title: '',
          description: '',
          targetAudience: '',
          kpis: '',
          timeframe: '',
          budget: '',
          marketAnalysis: '',
          competitors: '',
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error creating objective:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDashboard = async () => {
    if (!selectedObjective) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/marketingos/generate-dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectiveId: selectedObjective.id,
          marketAnalysis: formData.marketAnalysis,
          competitors: formData.competitors.split('\n').filter(c => c.trim()),
          assumptions: {
            budget: selectedObjective.budget?.toString() || 'Not set',
            timeframe: selectedObjective.timeframe,
          },
        }),
      });

      const data = await response.json() as any;
      if (data.result) {
        setDashboard(data.result);
      } else if (data.message) {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error generating dashboard:', error);
      alert('Error generating dashboard. Check your API key and Anthropic account.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !selectedObjective) return;
    setTaskLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          notes: `Marketing task for: ${selectedObjective.title}`,
          brand: 'mtech',
          status: 'not-started',
          priority: 'high',
          campaignId: selectedObjective.id,
          source: 'marketingos',
        }),
      });

      const data = await response.json() as any;
      if (data.result) {
        setTaskTitle('');
        alert('✓ Task added to your dashboard!');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task');
    } finally {
      setTaskLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-600" />
              MarketingOS
            </h1>
            <p className="text-slate-600 mt-1">Strategic marketing intelligence with Claude AI</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              New Objective
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-blue-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Create Marketing Objective</h2>
              <form onSubmit={handleCreateObjective} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g., Q3 Digital Marketing Campaign"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Timeframe</label>
                    <input
                      type="text"
                      value={formData.timeframe}
                      onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g., July - September 2026"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="What are you trying to achieve?"
                    rows={2}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Who are you targeting?"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Budget ($)</label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g., 50000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">KPIs (one per line)</label>
                    <textarea
                      value={formData.kpis}
                      onChange={(e) => setFormData({ ...formData, kpis: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g., 30% increase in traffic&#10;5000 qualified leads"
                      rows={2}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition"
                  >
                    {loading ? 'Creating...' : 'Create Objective'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {objectives.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Objectives List */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Objectives</h3>
                <div className="space-y-2">
                  {objectives.map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => {
                        setSelectedObjective(obj);
                        setDashboard(null);
                        setFormData({
                          ...formData,
                          marketAnalysis: '',
                          competitors: '',
                        });
                      }}
                      className={`w-full p-3 text-left rounded-lg border-2 transition ${
                        selectedObjective?.id === obj.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <p className="font-medium text-slate-900">{obj.title}</p>
                      <p className="text-xs text-slate-600">{obj.timeframe}</p>
                      {obj.budget && <p className="text-xs text-blue-600">Budget: ${obj.budget}</p>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strategy Generator */}
              {selectedObjective && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Generate Strategy</h3>
                  <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Market Analysis
                      </label>
                      <textarea
                        value={formData.marketAnalysis}
                        onChange={(e) => setFormData({ ...formData, marketAnalysis: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="Current market insights and trends..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Competitors (one per line)
                      </label>
                      <textarea
                        value={formData.competitors}
                        onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="e.g., HubSpot&#10;Marketo"
                        rows={2}
                      />
                    </div>

                    <button
                      onClick={handleGenerateDashboard}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-400 transition font-medium"
                    >
                      <Zap className="w-4 h-4" />
                      {loading ? 'Generating with Claude...' : 'Generate Strategy'}
                    </button>

                    {dashboard && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                        ✓ Strategy generated successfully
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h5 className="font-medium text-slate-900 mb-3">Add to Dashboard</h5>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleCreateTask()}
                          placeholder="e.g., Launch LinkedIn campaign..."
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                        <button
                          onClick={handleCreateTask}
                          disabled={taskLoading || !taskTitle.trim()}
                          className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-400 transition text-sm font-medium"
                        >
                          {taskLoading ? '...' : '✓ Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dashboard Display */}
              {dashboard && selectedObjective && (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Generated Dashboard
                  </h3>
                  <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">{dashboard.title}</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{dashboard.strategy}</p>
                    </div>

                    <div>
                      <h5 className="font-medium text-slate-900 mb-2">Tactics</h5>
                      <ul className="space-y-1">
                        {dashboard.tactics.map((tactic, i) => (
                          <li key={i} className="text-sm text-slate-600 flex gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            {tactic}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium text-slate-900 mb-2">Key Metrics</h5>
                      <div className="space-y-1">
                        {Object.entries(dashboard.metrics).map(([metric, description]) => (
                          <div key={metric} className="text-sm">
                            <span className="font-medium text-slate-900">{metric}</span>
                            <p className="text-slate-600">{description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {objectives.length === 0 && !showForm && (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-600 mb-2">No marketing objectives yet</h3>
              <p className="text-slate-500 mb-6">Create your first marketing objective to get started</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Objective
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
