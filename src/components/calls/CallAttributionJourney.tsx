import { ChevronRight, ChevronDown } from 'lucide-react';

const INFINITY_STEPS = ['Marketing Campaign', 'Call', 'Qualified Call'];
const ACUMATICA_STEPS = ['CRM Lead', 'Opportunity', 'Pipeline', 'Won Revenue'];

// Explanatory only — makes the two-source attribution chain obvious
// (Infinity measures call activity, Acumatica measures the commercial
// outcome) without implying either is connected or complete. No figures,
// real or fake, appear here. Deliberately restrained, same pattern as
// PPC's Measurement Journey, kept as a separate component so this page
// doesn't depend on PPC's (approved, unchanged) implementation.
export function CallAttributionJourney() {
  return (
    <div className="v2-ppc-journey">
      <div className="v2-ppc-journey-row">
        <span className="v2-ppc-journey-source">Infinity</span>
        <div className="v2-ppc-journey-steps">
          {INFINITY_STEPS.map((step, i) => (
            <div key={step} className="v2-ppc-journey-step-wrap">
              <span className="v2-ppc-journey-step" data-group="ads">{step}</span>
              {i < INFINITY_STEPS.length - 1 && <ChevronRight size={14} color="var(--v2-grey)" />}
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
          {ACUMATICA_STEPS.map((step, i) => (
            <div key={step} className="v2-ppc-journey-step-wrap">
              <span className="v2-ppc-journey-step" data-group="crm">{step}</span>
              {i < ACUMATICA_STEPS.length - 1 && <ChevronRight size={14} color="var(--v2-grey)" />}
            </div>
          ))}
        </div>
      </div>

      <p className="v2-ppc-journey-note">
        Infinity measures call activity. Acumatica will measure the commercial outcome. Neither call qualification
        nor CRM linkage exists today — figures on this page are honest "Not connected" states, not placeholders.
      </p>
    </div>
  );
}
