import { useState } from 'react';
import { OutputApprovalPanel } from './OutputApprovalPanel';

interface TaskDraftsProps {
  workspace: any;
  taskId: string;
  currentUserId: string;
  onUpdate: () => void;
}

export function TaskDrafts({ workspace, taskId, currentUserId, onUpdate }: TaskDraftsProps) {
  const [drafts, setDrafts] = useState(workspace.drafts || []);
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  const [approvingDraftId, setApprovingDraftId] = useState<string | null>(null);

  if (drafts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <p className="text-slate-400 text-lg">No drafts yet</p>
          <p className="text-slate-500 text-sm mt-2">When the specialist creates working versions, they'll appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="space-y-4">
        {drafts.map((draft) => (
          <div key={draft.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
            onClick={() => setSelectedDraft(draft)}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-50">{draft.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Version {draft.version} by {draft.created_by_name || 'System'}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
                v{draft.version}
              </span>
            </div>
            <p className="text-slate-300 text-sm line-clamp-2">{draft.content}</p>
          </div>
        ))}
      </div>

      {/* Draft Detail Modal */}
      {selectedDraft && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-50">{selectedDraft.title}</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Version {selectedDraft.version} • {selectedDraft.created_by_name || 'System'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDraft(null)}
                  className="text-slate-400 hover:text-slate-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="prose prose-invert max-w-none mb-8">
                <div className="text-slate-200 whitespace-pre-wrap">{selectedDraft.content}</div>
              </div>

              {approvingDraftId !== selectedDraft.id && (
                <OutputApprovalPanel
                  taskId={taskId}
                  draftId={selectedDraft.id}
                  draftTitle={selectedDraft.title}
                  draftContent={selectedDraft.content}
                  currentUserId={currentUserId}
                  onApprove={() => {
                    setSelectedDraft(null);
                    onUpdate();
                  }}
                  onCancel={() => setApprovingDraftId(null)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
