import { useState, useEffect } from 'react';

const TEAM_MEMBERS = [
  { id: 'marketing-director', label: 'Marketing Director' },
  { id: 'website-auditor', label: 'Website Manager' },
  { id: 'seo-ppc-manager', label: 'SEO & PPC Manager' },
  { id: 'email-marketing-manager', label: 'Email Marketing Manager' },
  { id: 'social-media-manager', label: 'Social Media Manager' },
  { id: 'case-study-writer', label: 'Case Study Writer' },
  { id: 'proposal-writer', label: 'Proposal Writer' },
  { id: 'funding-rewards-manager', label: 'Funding & Rewards Manager' },
];

export function SettingsPanel() {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [projectUrls, setProjectUrls] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // Load from localStorage on mount
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
    // Save API key
    if (apiKey.trim()) {
      localStorage.setItem('anthropic_api_key', apiKey);
    } else {
      localStorage.removeItem('anthropic_api_key');
    }

    // Save project URLs
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
    <div className="w-full h-full overflow-y-auto p-8 bg-slate-950 text-slate-50">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-slate-50">Settings</h1>

        {/* API Key Section */}
        <div className="mb-10 p-6 rounded-lg bg-slate-800 border border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-slate-50">Anthropic API Configuration</h2>
          <p className="text-sm mb-4 text-slate-400">
            Add your Anthropic API key to enable Sandy to generate marketing campaigns using Claude. Get your key at{' '}
            <a
              href="https://console.anthropic.com/account/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 underline hover:text-orange-400"
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
              className="flex-1 px-4 py-2 rounded-lg text-sm bg-slate-900 text-slate-50 border border-slate-700"
            />
            <button
              onClick={() => setApiKeyVisible(!apiKeyVisible)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-slate-400 border border-slate-700 hover:bg-slate-800 transition-colors"
            >
              {apiKeyVisible ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Team Member Claude Projects */}
        <div className="p-6 rounded-lg bg-slate-800 border border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-slate-50">Team Member Claude Projects</h2>
          <p className="text-sm mb-6 text-slate-400">
            Paste your team member's Claude.ai project URLs. The "Open" button on team member cards will link directly to their project.
          </p>

          <div className="space-y-4">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.id}>
                <label className="text-sm font-medium mb-2 block text-slate-300">{member.label}</label>
                <input
                  type="url"
                  value={projectUrls[member.id] || ''}
                  onChange={(e) => handleUrlChange(member.id, e.target.value)}
                  placeholder="https://claude.ai/projects/..."
                  className="w-full px-4 py-2 rounded-lg text-sm bg-slate-900 text-slate-50 border border-slate-700"
                />
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white transition-colors"
            >
              Save Settings
            </button>
            {saved && <span className="text-sm font-medium text-green-400">✓ Saved successfully</span>}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-10 p-6 rounded-lg bg-slate-800 border border-slate-700">
          <h3 className="font-bold mb-3 text-slate-50">How This Works</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>✓ API key is stored securely in your browser (never sent to servers)</li>
            <li>✓ Team member URLs are saved locally in localStorage</li>
            <li>✓ Click team member cards to jump to their Claude project</li>
            <li>✓ Sandy uses your API key to generate realistic campaign workflows</li>
            <li>✓ All data stays in your browser — nothing is transmitted</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
