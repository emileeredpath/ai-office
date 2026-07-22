import { useState, useEffect } from 'react';

const TEAM_MEMBERS = [
<<<<<<< HEAD
  { id: 'marketing-director', label: 'Marketing Director' },
  { id: 'website-auditor', label: 'Website Manager' },
  { id: 'seo-ppc-manager', label: 'SEO & PPC Manager' },
  { id: 'email-marketing-manager', label: 'Email Marketing Manager' },
  { id: 'social-media-manager', label: 'Social Media Manager' },
  { id: 'case-study-writer', label: 'Case Study Writer' },
  { id: 'proposal-writer', label: 'Proposal Writer' },
  { id: 'funding-rewards-manager', label: 'Funding & Rewards Manager' },
=======
  { id: 'email_manager', label: 'Email Marketing Manager' },
  { id: 'website_manager', label: 'Website Manager' },
  { id: 'seo_ppc_manager', label: 'SEO & PPC Manager' },
  { id: 'social_media_manager', label: 'Social Media Manager' },
  { id: 'proposal_writer', label: 'Proposal Writer' },
  { id: 'case_study_writer', label: 'Case Study Writer' },
  { id: 'funding_manager', label: 'Funding & Rewards Manager' },
>>>>>>> claude/new-session-f2d46t
];

export function SettingsPanel() {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [projectUrls, setProjectUrls] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

<<<<<<< HEAD
  // Load from localStorage on mount
=======
>>>>>>> claude/new-session-f2d46t
  useEffect(() => {
    const savedKey = localStorage.getItem('anthropic_api_key') || '';
    setApiKey(savedKey);

    const savedUrls: Record<string, string> = {};
    TEAM_MEMBERS.forEach((member) => {
      const url = localStorage.getItem(`claude_project_url_${member.id}`) || '';
      savedUrls[member.id] = url;
    });
    setProjectUrls(savedUrls);
  }, []);

  const handleSave = () => {
<<<<<<< HEAD
    // Save API key
=======
>>>>>>> claude/new-session-f2d46t
    if (apiKey.trim()) {
      localStorage.setItem('anthropic_api_key', apiKey);
    } else {
      localStorage.removeItem('anthropic_api_key');
    }

<<<<<<< HEAD
    // Save project URLs
=======
>>>>>>> claude/new-session-f2d46t
    TEAM_MEMBERS.forEach((member) => {
      const url = projectUrls[member.id] || '';
      if (url.trim()) {
        localStorage.setItem(`claude_project_url_${member.id}`, url);
      } else {
        localStorage.removeItem(`claude_project_url_${member.id}`);
      }
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleUrlChange = (memberId: string, value: string) => {
    setProjectUrls((prev) => ({
      ...prev,
      [memberId]: value,
    }));
  };

  return (
<<<<<<< HEAD
    <div className="w-full h-full overflow-y-auto p-8 bg-slate-950 text-slate-50">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-slate-50">Settings</h1>

        {/* API Key Section */}
        <div className="mb-10 p-6 rounded-lg bg-slate-800 border border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-slate-50">Anthropic API Configuration</h2>
          <p className="text-sm mb-4 text-slate-400">
=======
    <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>

        {/* API Key Section */}
        <div className="mb-10 p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Anthropic API Configuration
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
>>>>>>> claude/new-session-f2d46t
            Add your Anthropic API key to enable Sandy to generate marketing campaigns using Claude. Get your key at{' '}
            <a
              href="https://console.anthropic.com/account/keys"
              target="_blank"
              rel="noopener noreferrer"
<<<<<<< HEAD
              className="text-orange-500 underline hover:text-orange-400"
=======
              style={{ color: '#F97031', textDecoration: 'none', fontWeight: '500' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
>>>>>>> claude/new-session-f2d46t
            >
              console.anthropic.com
            </a>
          </p>
          <div className="flex gap-2">
            <input
              type={apiKeyVisible ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
<<<<<<< HEAD
              className="flex-1 px-4 py-2 rounded-lg text-sm bg-slate-900 text-slate-50 border border-slate-700"
            />
            <button
              onClick={() => setApiKeyVisible(!apiKeyVisible)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-slate-400 border border-slate-700 hover:bg-slate-800 transition-colors"
=======
              className="flex-1 px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: '#0A0E14',
                borderColor: 'var(--border-color)',
                border: '1px solid',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={() => setApiKeyVisible(!apiKeyVisible)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-color)',
                border: '1px solid',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2A3141')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--border-color)')}
>>>>>>> claude/new-session-f2d46t
            >
              {apiKeyVisible ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Team Member Claude Projects */}
<<<<<<< HEAD
        <div className="p-6 rounded-lg bg-slate-800 border border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-slate-50">Team Member Claude Projects</h2>
          <p className="text-sm mb-6 text-slate-400">
            Paste your team member's Claude.ai project URLs. The "Open" button on team member cards will link directly to their project.
=======
        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Team Member Claude Projects
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Paste your team member's Claude.ai project URLs. The project links will allow direct access to each team member's workspace.
>>>>>>> claude/new-session-f2d46t
          </p>

          <div className="space-y-4">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.id}>
<<<<<<< HEAD
                <label className="text-sm font-medium mb-2 block text-slate-300">{member.label}</label>
=======
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                  {member.label}
                </label>
>>>>>>> claude/new-session-f2d46t
                <input
                  type="url"
                  value={projectUrls[member.id] || ''}
                  onChange={(e) => handleUrlChange(member.id, e.target.value)}
                  placeholder="https://claude.ai/projects/..."
<<<<<<< HEAD
                  className="w-full px-4 py-2 rounded-lg text-sm bg-slate-900 text-slate-50 border border-slate-700"
=======
                  className="w-full px-4 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: '#0A0E14',
                    borderColor: 'var(--border-color)',
                    border: '1px solid',
                    color: 'var(--text-primary)',
                  }}
>>>>>>> claude/new-session-f2d46t
                />
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={handleSave}
<<<<<<< HEAD
              className="px-6 py-2 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white transition-colors"
            >
              Save Settings
            </button>
            {saved && <span className="text-sm font-medium text-green-400">✓ Saved successfully</span>}
=======
              className="px-6 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: '#F97031',
                color: 'white',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E85E1F')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F97031')}
            >
              Save Settings
            </button>
            {saved && <span className="text-sm font-medium" style={{ color: '#1D9E75' }}>✓ Saved successfully</span>}
>>>>>>> claude/new-session-f2d46t
          </div>
        </div>

        {/* Info Section */}
<<<<<<< HEAD
        <div className="mt-10 p-6 rounded-lg bg-slate-800 border border-slate-700">
          <h3 className="font-bold mb-3 text-slate-50">How This Works</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>✓ API key is stored securely in your browser (never sent to servers)</li>
            <li>✓ Team member URLs are saved locally in localStorage</li>
            <li>✓ Click team member cards to jump to their Claude project</li>
            <li>✓ Sandy uses your API key to generate realistic campaign workflows</li>
=======
        <div className="mt-10 p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
          <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            How This Works
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>✓ API key is stored securely in your browser (never sent to servers)</li>
            <li>✓ Team member URLs are saved locally in localStorage</li>
            <li>✓ Sandy uses your API key to generate campaigns and content</li>
>>>>>>> claude/new-session-f2d46t
            <li>✓ All data stays in your browser — nothing is transmitted</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
