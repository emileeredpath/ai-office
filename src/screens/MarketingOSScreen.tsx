import { Brain, MessageCircle, Target, CheckSquare } from 'lucide-react';

const CLAUDE_PROJECT_URL = 'https://claude.ai/project/019ef9de-64f0-75c3-8a1e-67749db5192e';

export function MarketingOSScreen() {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Brain className="w-8 h-8 text-blue-600" />
          MarketingOS
        </h1>
        <p className="text-slate-600 mt-1">Marketing intelligence, powered by Sandy</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-md p-8 border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 mb-2">How this works</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  MarketingOS is your source of truth — objectives, tasks and campaigns
                  all live here. For strategy, market analysis and planning, talk to Sandy
                  directly in your Claude project. Sandy can add tasks straight to your
                  dashboard as you decide on next steps together.
                </p>
                <a
                  href={CLAUDE_PROJECT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium transition"
                  style={{ backgroundColor: '#F97031' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E0631F')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F97031')}
                >
                  Open MTech AI
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <a
              href="#objectives"
              onClick={(e) => e.preventDefault()}
              className="bg-white rounded-lg shadow-md p-6 border border-slate-200 hover:border-blue-300 transition group"
            >
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Objectives</h3>
              </div>
              <p className="text-sm text-slate-600">
                Track goals, KPIs and deadlines tied to your campaigns.
              </p>
            </a>

            <a
              href="#tasks"
              onClick={(e) => e.preventDefault()}
              className="bg-white rounded-lg shadow-md p-6 border border-slate-200 hover:border-blue-300 transition group"
            >
              <div className="flex items-center gap-3 mb-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Tasks</h3>
              </div>
              <p className="text-sm text-slate-600">
                Everything Sandy suggests becomes a task here, ready to action.
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
