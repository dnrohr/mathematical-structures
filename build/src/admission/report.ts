import { stableStringify } from '../emit.js';
import type { AdmissionReport } from './model.js';

export function renderJson(reports: AdmissionReport[]): string {
  return stableStringify(reports.length === 1 ? reports[0] : reports);
}

export function renderText(reports: AdmissionReport[]): string {
  const lines: string[] = [];
  for (const [reportIndex, report] of reports.entries()) {
    if (reportIndex > 0) lines.push('', '---', '');
    lines.push(
      `Candidate ${report.dossier.id}`,
      `Dossier: ${report.dossier.file}`,
      `Workflow: ${report.dossier.workflow_state}`,
      `Recommendation: ${report.recommendation.disposition} (human decision required)`,
      `Rationale: ${report.recommendation.rationale}`,
      `Results: ${report.summary.errors} error(s), ${report.summary.warnings} warning(s), ${report.summary.signals} signal(s)`,
      '',
      'Normalization matches:',
    );
    if (report.matches.length === 0) lines.push('  - none');
    for (const match of report.matches) {
      lines.push(
        `  - ${match.slug}: ${match.relationship}; trigger "${match.trigger}"; ${match.reason} [${match.provenance}]`,
      );
    }
    lines.push('', 'Graph value (separate from truth/evidence):');
    for (const dimension of report.graph_value) {
      lines.push(`  - ${dimension.id}: ${dimension.signal}; ${dimension.reason}`);
    }
    lines.push('', 'Rule results:');
    if (report.rule_results.length === 0) lines.push('  - none');
    for (const rule of report.rule_results) {
      lines.push(
        `  - [${rule.severity}] ${rule.rule_id} (${rule.kind}) ${rule.subject}: ${rule.reason}`,
        `    provenance: ${rule.provenance.join('; ')}`,
      );
    }
    lines.push('', 'Supplied untrusted judgments:');
    lines.push(
      `  - generated hypotheses: ${report.supplied_judgments.generated_hypotheses.length}`,
      `  - automated judgments: ${report.supplied_judgments.automated_judgments.length}`,
      `  - adversarial reviews: ${report.supplied_judgments.adversarial_reviews.length}`,
      `  - human decisions: ${report.supplied_judgments.human_decisions.length}`,
    );
  }
  return `${lines.join('\n')}\n`;
}
