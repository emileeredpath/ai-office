import { useState, useEffect } from 'react';
import * as api from '@/services/api';

interface CompanyKnowledgePanelProps {
  companyId: string;
  currentUserId: string;
}

export function CompanyKnowledgePanel({ companyId, currentUserId }: CompanyKnowledgePanelProps) {
  const [guidelines, setGuidelines] = useState<any[]>([]);
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'guidelines' | 'knowledge'>('guidelines');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Guidelines form state
  const [guidelineForm, setGuidelineForm] = useState({
    category: 'voice',
    title: '',
    description: '',
    examples: [] as string[],
  });

  // Knowledge form state
  const [knowledgeForm, setKnowledgeForm] = useState({
    title: '',
    content: '',
    domain: '',
    type: 'process',
    tags: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [guidelinesData, knowledgeData] = await Promise.all([
        api.getCompanyGuidelines(companyId),
        api.getCompanyKnowledge(companyId),
      ]);
      setGuidelines(guidelinesData);
      setKnowledge(knowledgeData);
    } catch (error) {
      console.error('Failed to load knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuideline = async () => {
    if (!guidelineForm.title.trim() || !guidelineForm.description.trim()) {
      alert('Title and description are required');
      return;
    }

    try {
      await api.createCompanyGuideline(companyId, {
        ...guidelineForm,
        createdById: currentUserId,
      });
      setGuidelines([...guidelines, guidelineForm]);
      setGuidelineForm({
        category: 'voice',
        title: '',
        description: '',
        examples: [],
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create guideline:', error);
      alert('Failed to create guideline');
    }
  };

  const handleAddKnowledge = async () => {
    if (!knowledgeForm.title.trim() || !knowledgeForm.content.trim()) {
      alert('Title and content are required');
      return;
    }

    try {
      await api.createKnowledgeEntry(companyId, {
        ...knowledgeForm,
        ownerId: currentUserId,
      });
      setKnowledge([...knowledge, knowledgeForm]);
      setKnowledgeForm({
        title: '',
        content: '',
        domain: '',
        type: 'process',
        tags: [],
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create knowledge entry:', error);
      alert('Failed to create knowledge entry');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-slate-400">Loading company knowledge...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 mb-2">Company Knowledge Base</h1>
        <p className="text-slate-400">
          Build institutional knowledge that specialists use to improve their work
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('guidelines')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'guidelines'
              ? 'text-orange-400 border-b-2 border-orange-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Brand Guidelines ({guidelines.length})
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'knowledge'
              ? 'text-orange-400 border-b-2 border-orange-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Company Knowledge ({knowledge.length})
        </button>
      </div>

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors"
        >
          {showAddForm ? '✕ Cancel' : '+ Add New'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
          <h3 className="text-lg font-bold text-slate-50 mb-4">
            Add {activeTab === 'guidelines' ? 'Brand Guideline' : 'Knowledge Entry'}
          </h3>

          {activeTab === 'guidelines' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={guidelineForm.category}
                  onChange={(e) =>
                    setGuidelineForm({ ...guidelineForm, category: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 focus:outline-none focus:border-orange-500"
                >
                  <option value="voice">Voice & Tone</option>
                  <option value="style">Style Guide</option>
                  <option value="branding">Branding</option>
                  <option value="audience">Audience</option>
                  <option value="values">Company Values</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  value={guidelineForm.title}
                  onChange={(e) =>
                    setGuidelineForm({ ...guidelineForm, title: e.target.value })
                  }
                  placeholder="e.g., Professional Tone"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={guidelineForm.description}
                  onChange={(e) =>
                    setGuidelineForm({ ...guidelineForm, description: e.target.value })
                  }
                  placeholder="Describe this guideline..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <button
                onClick={handleAddGuideline}
                className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
              >
                Add Guideline
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  value={knowledgeForm.title}
                  onChange={(e) =>
                    setKnowledgeForm({ ...knowledgeForm, title: e.target.value })
                  }
                  placeholder="e.g., Email Campaign Process"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
                <textarea
                  value={knowledgeForm.content}
                  onChange={(e) =>
                    setKnowledgeForm({ ...knowledgeForm, content: e.target.value })
                  }
                  placeholder="Document your knowledge here..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <button
                onClick={handleAddKnowledge}
                className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
              >
                Add Knowledge
              </button>
            </div>
          )}
        </div>
      )}

      {/* Guidelines List */}
      {activeTab === 'guidelines' && (
        <div className="space-y-4">
          {guidelines.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No brand guidelines yet</p>
              <p className="text-slate-500 text-sm mt-2">
                Add guidelines to help specialists maintain brand consistency
              </p>
            </div>
          ) : (
            guidelines.map((guideline) => (
              <div key={guideline.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-50">{guideline.title}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-orange-900/30 text-orange-200 mt-1 inline-block">
                      {guideline.category}
                    </span>
                  </div>
                </div>
                <p className="text-slate-300 mt-3">{guideline.description}</p>
                {guideline.examples && guideline.examples.length > 0 && (
                  <div className="mt-3 text-sm text-slate-400">
                    <p className="font-medium mb-1">Examples:</p>
                    <ul className="list-disc list-inside">
                      {guideline.examples.map((ex, i) => (
                        <li key={i}>{ex}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Knowledge List */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          {knowledge.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No knowledge entries yet</p>
              <p className="text-slate-500 text-sm mt-2">
                Document processes, decisions, and lessons learned
              </p>
            </div>
          ) : (
            knowledge.map((entry) => (
              <div key={entry.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-slate-50">{entry.title}</h3>
                  {entry.domain && (
                    <span className="text-xs px-2 py-1 rounded bg-blue-900/30 text-blue-200">
                      {entry.domain}
                    </span>
                  )}
                </div>
                <p className="text-slate-300 mt-3 whitespace-pre-wrap">{entry.content}</p>
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {entry.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
