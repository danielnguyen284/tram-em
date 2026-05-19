export type CommunityModerationAction = 'block' | 'review';

export type CommunityModerationTerm = {
  id?: string;
  term: string;
  action: CommunityModerationAction;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CommunityModerationResult =
  | {
      status: 'approved';
      reason: null;
      matches: string[];
    }
  | {
      status: 'pending_review';
      reason: string;
      matches: string[];
    }
  | {
      status: 'blocked';
      reason: string;
      matches: string[];
    };

export const DEFAULT_COMMUNITY_MODERATION_TERMS: CommunityModerationTerm[] = [
  { term: 'spam', action: 'block', is_active: true },
  { term: 'scam', action: 'block', is_active: true },
  { term: 'lua dao', action: 'block', is_active: true },
  { term: 'tu tu', action: 'review', is_active: true },
  { term: 'tu hai', action: 'review', is_active: true },
  { term: 'muon chet', action: 'review', is_active: true },
];

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contentMatchesTerm(content: string, term: string) {
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm) return false;

  const paddedContent = ` ${content} `;
  const paddedTerm = ` ${normalizedTerm} `;
  return paddedContent.includes(paddedTerm);
}

export function evaluateCommunityContent(
  content: string,
  terms: CommunityModerationTerm[],
): CommunityModerationResult {
  const normalizedContent = normalizeText(content);
  const activeTerms = terms.filter((term) => term.is_active !== false);

  const blockedMatches = activeTerms
    .filter((term) => term.action === 'block' && contentMatchesTerm(normalizedContent, term.term))
    .map((term) => term.term);

  if (blockedMatches.length > 0) {
    return {
      status: 'blocked',
      reason: 'Nội dung chứa từ ngữ nằm trong blacklist.',
      matches: blockedMatches,
    };
  }

  const reviewMatches = activeTerms
    .filter((term) => term.action === 'review' && contentMatchesTerm(normalizedContent, term.term))
    .map((term) => term.term);

  if (reviewMatches.length > 0) {
    return {
      status: 'pending_review',
      reason: 'Nội dung chứa từ ngữ cần admin duyệt.',
      matches: reviewMatches,
    };
  }

  return {
    status: 'approved',
    reason: null,
    matches: [],
  };
}
