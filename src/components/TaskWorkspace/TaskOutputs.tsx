import { useState } from 'react';

interface TaskOutputsProps {
  workspace: any;
  taskId: string;
  currentUserId: string;
  onUpdate: () => void;
}

export function TaskOutputs({ workspace, taskId, currentUserId, onUpdate }: TaskOutputsProps) {
  const [outputs, setOutputs] = useState(workspace.outputs || []);
  const [selectedOutput, setSelectedOutput] = useState<any>(null);

  if (outputs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <p className="text-slate-400 text-lg">No approved outputs yet</p>
          <p className="text-slate-500 text-sm mt-2">Approve drafts to create permanent deliverables</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="space-y-4">
        {outputs.map((output) => (
          <div
            key={output.id}
            className="bg-slate-800 rounded-lg p-6 border border-green-700/50 cursor-pointer hover:border-green-600 transition-colors"
            onClick={() => setSelectedOutput(output)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <h3 className="text-lg font-bold text-slate-50">{output.title}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Created by {output.created_by_name} • Approved by {output.approved_by_name}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-green-900/30 text-green-200 border border-green-700/50">
                {output.type || 'document'}
              </span>
            </div>
            <p className="text-slate-300 text-sm line-clamp-2">{output.content}</p>
          </div>
        ))}
      </div>

      {/* Output Detail Modal */}
      {selectedOutput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-400">✓</span>
                    <h2 className="text-2xl font-bold text-slate-50">{selectedOutput.title}</h2>
                  </div>
                  <p className="text-sm text-slate-400">
                    Type: {selectedOutput.type || 'document'} • Created by {selectedOutput.created_by_name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOutput(null)}
                  className="text-slate-400 hover:text-slate-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-200">
                  ✓ Approved by {selectedOutput.approved_by_name} on {new Date(selectedOutput.approved_at).toLocaleDateString()}
                </p>
              </div>

              <div className="prose prose-invert max-w-none">
                <div className="text-slate-200 whitespace-pre-wrap">{selectedOutput.content}</div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-6">
              <button
                onClick={() => setSelectedOutput(null)}
                className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
