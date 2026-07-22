import { useState, useMemo } from 'react';
import { REAL_TASKS, BRANDS } from '@/data/mtechEmployees';
import { generateMarketingContent } from '@/services/contentGenerator';

interface Output {
  id: string;
  taskId: string;
  title: string;
  type: 'social_post' | 'design_brief' | 'email_campaign' | 'chart' | 'infographic';
  content: string;
  preview: string;
  created: Date;
}

export function VisualOutputs() {
  const [outputs, setOutputs] = useState<Output[]>([
    {
      id: 'out-1',
      taskId: 'task-1',
      title: "Martyn's Law Email Campaign",
      type: 'email_campaign',
      content: `Subject: Security Compliance That Works

Dear [Prospect],

Martyn's Law compliance doesn't have to be complicated. Our proven security framework helps enterprises stay protected and compliant.

Key benefits:
✓ Enterprise-grade protection
✓ Compliance management
✓ 24/7 monitoring

Schedule your demo today.`,
      preview: '📧 Email Campaign Ready',
      created: new Date(Date.now() - 3600000),
    },
    {
      id: 'out-2',
      taskId: 'task-2',
      title: 'Social Media - Martyn Law Awareness',
      type: 'social_post',
      content: `🎯 Martyn's Law is transforming security across the UK.

Is your organization ready? Our solutions help you stay compliant while protecting your team.

Learn how enterprises are leading the way.

#MartynLaw #Security #Compliance`,
      preview: '📱 Social Post Ready',
      created: new Date(Date.now() - 7200000),
    },
  ]);

  const [selectedOutput, setSelectedOutput] = useState<Output | null>(null);
  const [generatingForTask, setGeneratingForTask] = useState<string | null>(null);

  const incompleteTasks = useMemo(() => {
    return REAL_TASKS.filter((t) => t.status !== 'complete').slice(0, 5);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email_campaign':
        return '#3B82F6';
      case 'social_post':
        return '#EC4899';
      case 'design_brief':
        return '#8B5CF6';
      case 'chart':
        return '#10B981';
      case 'infographic':
        return '#F59E0B';
      default:
        return 'var(--accent-orange)';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleGenerateOutput = async (taskId: string, type: Output['type']) => {
    setGeneratingForTask(taskId);

    const task = REAL_TASKS.find((t) => t.id === taskId);
    if (!task) return;

    const { content, preview } = await generateMarketingContent(taskId, type);

    const newOutput: Output = {
      id: `out-${Date.now()}`,
      taskId,
      title: task.title,
      type,
      content,
      preview: `${getTypeEmoji(type)} ${preview}`,
      created: new Date(),
    };

    setOutputs((prev) => [...prev, newOutput]);
    setGeneratingForTask(null);
  };

  const handleDownloadOutput = (output: Output) => {
    const element = document.createElement('a');
    const file = new Blob([output.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${output.title.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Visual Outputs
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mb-8">
          Generated content, designs, and assets
        </p>

        <div className="grid grid-cols-3 gap-8">
          {/* Generate New */}
          <div className="col-span-1">
            <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Generate New
            </h2>
            <div className="space-y-3">
              {incompleteTasks.map((task) => (
                <div key={task.id} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>
                    {task.title}
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleGenerateOutput(task.id, 'email_campaign')}
                      disabled={generatingForTask === task.id}
                      className="w-full px-2 py-1 rounded text-xs transition-all"
                      style={{
                        backgroundColor: generatingForTask === task.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.1)',
                        color: '#3B82F6',
                      }}
                    >
                      {generatingForTask === task.id ? '⏳ Email...' : '📧 Email'}
                    </button>
                    <button
                      onClick={() => handleGenerateOutput(task.id, 'social_post')}
                      disabled={generatingForTask === task.id}
                      className="w-full px-2 py-1 rounded text-xs transition-all"
                      style={{
                        backgroundColor: generatingForTask === task.id ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.1)',
                        color: '#EC4899',
                      }}
                    >
                      {generatingForTask === task.id ? '⏳ Post...' : '📱 Social'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Outputs */}
          <div className="col-span-2">
            <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Generated Outputs ({outputs.length})
            </h2>
            <div className="space-y-3">
              {outputs.length === 0 ? (
                <div className="p-8 text-center rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>No outputs yet</p>
                </div>
              ) : (
                outputs.map((output) => (
                  <div
                    key={output.id}
                    className="p-4 rounded-lg cursor-pointer transition-all"
                    onClick={() => setSelectedOutput(output)}
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-orange)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{output.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              backgroundColor: `${getTypeColor(output.type)}22`,
                              color: getTypeColor(output.type),
                            }}
                          >
                            {getTypeLabel(output.type)}
                          </span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                            {output.created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadOutput(output);
                        }}
                        className="px-3 py-1 rounded text-xs transition-all"
                        style={{
                          backgroundColor: 'var(--accent-orange)',
                          color: 'white',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {selectedOutput && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
            onClick={() => setSelectedOutput(null)}
          >
            <div
              className="bg-slate-900 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-slate-900 border-b p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {selectedOutput.title}
                    </h2>
                    <span
                      className="inline-block px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${getTypeColor(selectedOutput.type)}22`,
                        color: getTypeColor(selectedOutput.type),
                      }}
                    >
                      {getTypeLabel(selectedOutput.type)}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedOutput(null)}
                    className="text-2xl font-bold transition-all"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div
                  className="p-4 rounded-lg mb-6 text-sm whitespace-pre-wrap"
                  style={{
                    backgroundColor: '#0A0E14',
                    borderColor: 'var(--border-color)',
                    border: '1px solid',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    lineHeight: '1.6',
                  }}
                >
                  {selectedOutput.content}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleDownloadOutput(selectedOutput);
                      setSelectedOutput(null);
                    }}
                    className="px-4 py-2 rounded-lg font-medium transition-all text-sm flex-1"
                    style={{
                      backgroundColor: 'var(--accent-orange)',
                      color: 'white',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    Download
                  </button>
                  <button
                    onClick={() => setSelectedOutput(null)}
                    className="px-4 py-2 rounded-lg font-medium transition-all text-sm"
                    style={{
                      backgroundColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--border-color)')}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getTypeEmoji(type: string): string {
  switch (type) {
    case 'email_campaign':
      return '📧';
    case 'social_post':
      return '📱';
    case 'design_brief':
      return '🎨';
    case 'chart':
      return '📊';
    case 'infographic':
      return '📈';
    default:
      return '📄';
  }
}

function generateSampleContent(title: string, type: string): string {
  if (type === 'email_campaign') {
    return `Subject: ${title}

Dear [Prospect Name],

I wanted to reach out and share how we've been helping companies like yours achieve their goals.

Our solutions deliver proven results:
• Increase efficiency by 40%
• Reduce costs by 25%
• Improve team collaboration

I'd love to discuss how we can help your team.

Best regards,
[Your Name]`;
  } else if (type === 'social_post') {
    return `🎯 ${title}

We're excited to share insights on ${title.toLowerCase()}.

Key takeaway: Focus on what matters most to drive real results.

Ready to learn more? Link in bio 🔗

#Marketing #Strategy #Growth`;
  } else if (type === 'design_brief') {
    return `DESIGN BRIEF: ${title}

Objective:
Create compelling visual content for ${title}

Target Audience:
Marketing decision-makers and team leads

Key Messages:
1. Efficiency & Results
2. Team Collaboration
3. Proven ROI

Deliverables:
- Hero image
- Social graphics
- Email headers`;
  } else if (type === 'chart') {
    return `PERFORMANCE CHART: ${title}

Data Points:
- Week 1: 45% progress
- Week 2: 62% progress
- Week 3: 78% progress
- Week 4: 92% progress

Trend: Steady improvement with accelerating momentum
Status: On track to complete ahead of schedule`;
  } else {
    return `CONTENT: ${title}\n\nThis is sample generated content for ${title}.`;
  }
}
