import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parse, stringify } from 'yaml';

const campaign = resolve(process.argv[2] ?? '');
if (!process.argv[2])
  throw new Error('usage: node scripts/apply-independent-review.mjs <campaign-directory>');
const reviewFile = join(campaign, 'independent-review.yaml');
const review = parse(readFileSync(reviewFile, 'utf8'));
if (review.review_schema !== '1.0.0' || !Array.isArray(review.entries))
  throw new Error('independent review must be a version 1.0.0 document with entries');
if (review.human_review_minutes_added !== 0)
  throw new Error('model-assisted review cannot add human review minutes');

for (const entry of review.entries) {
  const file = join(campaign, 'normalized', `${entry.candidate_id}.yaml`);
  const dossier = parse(readFileSync(file, 'utf8'));
  if (dossier.workflow?.state !== 'automated-review-passed')
    throw new Error(`${entry.candidate_id} is not at automated-review-passed`);
  const id = `${entry.candidate_id}-independent-review-${review.reviewed_on}`;
  const independent = {
    id,
    method: review.reviewer_kind,
    reviewer: review.reviewer,
    challenge: entry.challenge,
    response: entry.response,
    recommended_action: entry.disposition === 'reject' ? 'Reject.' : 'Retain for human review.',
    provenance: [reviewFile, `${file}#claims.${entry.candidate_id}-claim`],
  };
  dossier.adversarial_reviews = [
    ...(dossier.adversarial_reviews ?? []).filter((item) => item.id !== id),
    independent,
  ];
  writeFileSync(file, stringify(dossier, { lineWidth: 110 }), 'utf8');
}

console.log(
  `applied ${review.entries.length} independent reviews without changing workflow states`,
);
