import type { IdeaStatus } from './ideas';

type Transition = [IdeaStatus, IdeaStatus];

const LEGAL_TRANSITIONS: Transition[] = [
  ['submitted', 'under_review'],
  ['under_review', 'accepted'],
  ['under_review', 'rejected'],
];

export function isLegalTransition(from: IdeaStatus, to: IdeaStatus): boolean {
  return LEGAL_TRANSITIONS.some(([f, t]) => f === from && t === to);
}
