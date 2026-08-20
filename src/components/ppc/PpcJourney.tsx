import { ChevronRight, ChevronDown } from 'lucide-react';

const ADS_STEPS = ['Spend', 'Clicks', 'Conversions'];
const CRM_STEPS = ['Marketing Leads', 'Opportunities', 'Pipeline', 'Won Revenue'];

// Explanatory only — makes the two-source commercial journey obvious
// (what Google Ads will provide vs. what Acumatica will provide) without
// implying either is connected. No figures, real or fake, appear here.
// Deliberately restrained so it doesn't dominate the page.
export function PpcJourney() {
  return (
    <div className="v2-ppc-journey">
      <div className="v2-ppc-journey-row">
        <span className="v2-ppc-journey-source">Google Ads</span>
        <div className="v2-ppc-journey-steps">
          {ADS_STEPS.map((step, i) => (
            <div key={step} className="v2-ppc-journey-step-wrap">
              <span className="v2-ppc-journey-step" data-group="ads">{step}</span>
              {i < ADS_STEPS.length - 1 && <ChevronRight size={14} color="var(--v2-grey)" />}
            </div>
          ))}
        </div>
      </div>

      <div className="v2-ppc-journey-divider">
        <ChevronDown size={16} color="var(--v2-grey)" />
      </div>

      <div className="v2-ppc-journey-row">
        <span className="v2-ppc-journey-source">Acumatica CRM</span>
        <div className="v2-ppc-journey-steps">
          {CRM_STEPS.map((step, i) => (
            <div key={step} className="v2-ppc-journey-step-wrap">
              <span className="v2-ppc-journey-step" data-group="crm">{step}</span>
              {i < CRM_STEPS.length - 1 && <ChevronRight size={14} color="var(--v2-grey)" />}
            </div>
          ))}
        </div>
      </div>

      <p className="v2-ppc-journey-note">
        Google Ads will measure advertising performance. Acumatica will measure the commercial outcome. Neither is
        connected yet — figures below are honest "Not connected" states, not placeholders.
      </p>
    </div>
  );
}
