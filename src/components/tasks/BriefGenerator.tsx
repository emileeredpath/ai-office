import { useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { Task, Campaign, AISkill } from '@/types/index';
import { formatDate } from '@/utils/dateUtils';
import '@/styles/briefGenerator.css';

const SKILLS: { name: AISkill; description: string }[] = [
  { name: 'Email Marketing Manager', description: 'Write, build and schedule emails' },
  { name: 'Website Manager', description: 'Create and update website pages' },
  { name: 'SEO & PPC Manager', description: 'Keywords, Google Ads, landing pages' },
  { name: 'Social Media Manager', description: 'LinkedIn, Facebook, Instagram posts' },
  { name: 'Marketing Director', description: 'Strategy, campaign planning, direction' },
  { name: 'Proposal Writer', description: 'Tenders, capability statements, RFPs' },
  { name: 'Case Study Writer', description: 'Customer stories and testimonials' },
  { name: 'Funding & Rewards Manager', description: 'Grants, supplier funding, co-op' },
];

const MTECH_AI_PROJECT_URL = 'https://claude.ai/project/019ef9de-64f0-75c3-8a1e-67749db5192e';

interface BriefGeneratorProps {
  task: Task;
  campaign: Campaign | null;
}

export function BriefGenerator({ task, campaign }: BriefGeneratorProps) {
  const [selectedSkill, setSelectedSkill] = useState<AISkill>(SKILLS[0].name);
  const [helpDescription, setHelpDescription] = useState('');
  const [generatedBrief, setGeneratedBrief] = useState('');
  const [copied, setCopied] = useState(false);

  const generateBrief = () => {
    const briefText = `/${selectedSkill}

Task: ${task.title}
Brand: ${task.brand.charAt(0).toUpperCase() + task.brand.slice(1)}
Deadline: ${task.deadline ? formatDate(task.deadline) : 'TBC'}
Status: ${task.status}
${campaign ? `Campaign: ${campaign.name}` : ''}

What I need: ${helpDescription}

Task notes:
${task.notes || '(no notes)'}`;

    setGeneratedBrief(briefText);
  };

  const copyBrief = () => {
    navigator.clipboard.writeText(generatedBrief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openMTechAI = () => {
    window.open(MTECH_AI_PROJECT_URL, '_blank');
  };

  return (
    <div>
      <h3 className="task-detail-section-title">GET AI HELP ON THIS TASK</h3>

      <div className="brief-generator">
        <div className="brief-generator-section">
          <label className="brief-generator-label">Which skill do you need?</label>
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value as AISkill)}
            className="brief-generator-select"
          >
            {SKILLS.map((skill) => (
              <option key={skill.name} value={skill.name}>
                {skill.name} — {skill.description}
              </option>
            ))}
          </select>
        </div>

        <div className="brief-generator-section">
          <label className="brief-generator-label">What do you need help with?</label>
          <textarea
            value={helpDescription}
            onChange={(e) => setHelpDescription(e.target.value)}
            placeholder="Describe what you need help with on this task..."
            className="brief-generator-textarea"
          />
        </div>

        <button onClick={generateBrief} className="btn btn-primary w-full">
          Generate brief
        </button>

        {generatedBrief && (
          <>
            <div className="brief-generator-output">
              <pre className="brief-output-text">{generatedBrief}</pre>
            </div>

            <div className="brief-generator-actions">
              <button
                onClick={copyBrief}
                className={`brief-action-btn ${copied ? 'copied' : ''}`}
              >
                <Copy size={16} />
                {copied ? 'Copied!' : 'Copy brief'}
              </button>
              <button onClick={openMTechAI} className="brief-action-btn">
                Open MTech AI <ExternalLink size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
