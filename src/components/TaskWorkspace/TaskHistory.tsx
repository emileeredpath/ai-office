interface TaskHistoryProps {
  workspace: any;
}

export function TaskHistory({ workspace }: TaskHistoryProps) {
  const history = workspace.history || [];

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <p className="text-slate-400 text-lg">No history yet</p>
          <p className="text-slate-500 text-sm mt-2">All changes to this task will be recorded here</p>
        </div>
      </div>
    );
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'created': '📝 Created',
      'delegated': '👤 Delegated',
      'status_changed': '🔄 Status Changed',
      'output_approved': '✓ Output Approved',
      'message_added': '💬 Message',
      'draft_created': '📋 Draft Created',
    };
    return labels[action] || action;
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="relative">
        {/* Timeline */}
        <div className="space-y-6">
          {history.map((entry, index) => (
            <div key={entry.id} className="flex gap-6">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-orange-500 ring-2 ring-slate-800"></div>
                {index !== history.length - 1 && (
                  <div className="w-0.5 h-20 bg-gradient-to-b from-slate-700 to-transparent mt-2"></div>
                )}
              </div>

              {/* Entry content */}
              <div className="flex-1 pb-6">
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-slate-50">
                      {getActionLabel(entry.action)}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  {entry.actor_name && (
                    <p className="text-sm text-slate-400">by {entry.actor_name}</p>
                  )}
                  {entry.changes && (
                    <div className="mt-3 text-xs text-slate-400 bg-slate-900/50 rounded p-2">
                      <pre className="overflow-x-auto">
                        {JSON.stringify(entry.changes, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
