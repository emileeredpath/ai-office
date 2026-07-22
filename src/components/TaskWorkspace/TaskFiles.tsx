interface TaskFilesProps {
  workspace: any;
  taskId: string;
  currentUserId: string;
}

export function TaskFiles({ workspace, taskId, currentUserId }: TaskFilesProps) {
  const files = workspace.files || [];

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <p className="text-slate-400 text-lg">No files yet</p>
          <p className="text-slate-500 text-sm mt-2">Files uploaded to this task will appear here</p>
        </div>
      </div>
    );
  }

  const getFileIcon = (fileType: string) => {
    const type = fileType?.toLowerCase() || 'document';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('document')) return '📄';
    if (type.includes('spreadsheet')) return '📊';
    return '📎';
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="space-y-3">
        {files.map((file) => (
          <div key={file.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex items-center justify-between hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <span className="text-2xl">{getFileIcon(file.file_type)}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-50 font-medium truncate">{file.file_name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {file.uploaded_by_name} • {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-4">
              {file.file_size && (
                <span className="text-xs text-slate-400">
                  {(file.file_size / 1024).toFixed(1)}KB
                </span>
              )}
              <a
                href={file.file_path}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded text-sm bg-orange-600 hover:bg-orange-700 text-white font-medium"
              >
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
