import { useState, useEffect } from 'react';
import * as api from '@/services/api';

interface TaskTemplatesPanelProps {
  companyId: string;
  currentUserId: string;
}

export function TaskTemplatesPanel({ companyId, currentUserId }: TaskTemplatesPanelProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'marketing',
    defaultPriority: 'medium',
    estimatedHours: 8,
    requiredSpecialists: [] as string[],
  });

  const SPECIALISTS = ['Marketing Manager', 'Social Media Manager', 'Content Writer', 'Designer'];
  const CATEGORIES = ['marketing', 'sales', 'operations', 'finance', 'hr'];

  useEffect(() => {
    loadTemplates();
  }, [companyId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await api.getTaskTemplates(companyId);
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.name.trim()) {
      alert('Template name is required');
      return;
    }

    try {
      const newTemplate = await api.createTaskTemplate(companyId, formData);
      setTemplates([...templates, newTemplate]);
      setFormData({
        name: '',
        description: '',
        category: 'marketing',
        defaultPriority: 'medium',
        estimatedHours: 8,
        requiredSpecialists: [],
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create template');
    }
  };

  const toggleSpecialist = (specialist: string) => {
    setFormData({
      ...formData,
      requiredSpecialists: formData.requiredSpecialists.includes(specialist)
        ? formData.requiredSpecialists.filter((s) => s !== specialist)
        : [...formData.requiredSpecialists, specialist],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-slate-400">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 mb-2">Task Templates</h1>
        <p className="text-slate-400">Create reusable templates for recurring workflows</p>
      </div>

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-6 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors"
        >
          {showCreateForm ? '✕ Cancel' : '+ New Template'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
          <h3 className="text-lg font-bold text-slate-50 mb-4">Create Task Template</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Template Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Social Media Campaign Launch"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this workflow..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 focus:outline-none focus:border-orange-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Est. Hours</label>
                <input
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) })}
                  min="1"
                  max="40"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Required Specialists</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALISTS.map((specialist) => (
                  <button
                    key={specialist}
                    onClick={() => toggleSpecialist(specialist)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.requiredSpecialists.includes(specialist)
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {specialist}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateTemplate}
              className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
            >
              Create Template
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-4">
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No templates yet</p>
            <p className="text-slate-500 text-sm mt-2">Create templates to speed up task creation</p>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className="bg-slate-800 rounded-lg p-6 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-50">{template.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
                    {template.category}
                  </span>
                  <p className="text-xs text-slate-400 mt-2">Est. {template.estimated_hours}h</p>
                </div>
              </div>

              {template.required_specialists && template.required_specialists.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {template.required_specialists.map((spec: string) => (
                    <span key={spec} className="text-xs px-2 py-1 rounded bg-orange-900/30 text-orange-200">
                      {spec}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-2xl w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-50">{selectedTemplate.name}</h2>
                <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 mt-2 inline-block">
                  {selectedTemplate.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-slate-400 hover:text-slate-200 text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-slate-300 mb-6">{selectedTemplate.description}</p>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Estimated Duration</p>
                <p className="text-lg font-bold text-slate-50">{selectedTemplate.estimated_hours} hours</p>
              </div>

              {selectedTemplate.required_specialists && selectedTemplate.required_specialists.length > 0 && (
                <div>
                  <p className="text-sm text-slate-400">Required Specialists</p>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {selectedTemplate.required_specialists.map((spec: string) => (
                      <span key={spec} className="text-xs px-3 py-1 rounded bg-orange-900/30 text-orange-200">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedTemplate(null)}
              className="mt-6 px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
