/**
 * scopeMatcher.js — Scope match classifier (NFR6: isolated module)
 *
 * Implements the deterministic match rule from PRD Section 18 exactly.
 * No AI or machine learning is used (PRD §29 constraint).
 *
 * PRD §18 verbatim:
 *
 *   "A request is classified in_scope when its category tag equals the
 *    category tag of an existing scope item.
 *
 *    A request is classified possible_extra when it has no category tag
 *    and shares no word of 4 or more letters, excluding a fixed stop word
 *    list, with any scope item title or description.
 *
 *    A request is classified unclear when it has a category tag that does
 *    not match any scope item tag, or when it has no category tag but
 *    shares at least one word of 4 or more letters with a scope item title
 *    or description."
 *
 * Public API
 * ----------
 * classify(requestText, categoryTag, scopeItems) → 'in_scope' | 'possible_extra' | 'unclear'
 * tokenize(text) → Set<string>   (exported for unit testing)
 *
 * NOTE: This module is shared between the server (via require) and the client
 * (via import). It uses CommonJS syntax because the server requires it at
 * runtime. Webpack/CRA handles CommonJS modules in the client bundle correctly.
 */

'use strict';

// ---------------------------------------------------------------------------
// Stop word list
// PRD §18 requires "a fixed stop word list" but does not specify its contents.
// This list contains common English words of ≥4 letters that carry no
// domain meaning. It is fixed: every entry is a lowercase string of letters.
// ---------------------------------------------------------------------------
const STOP_WORDS = new Set([
  // Articles / determiners
  'this', 'that', 'these', 'those', 'such',
  // Pronouns
  'they', 'them', 'their', 'your', 'mine', 'ours', 'hers',
  // Auxiliary / modal verbs
  'have', 'will', 'been', 'were', 'would', 'could', 'should', 'shall',
  'must', 'might', 'does', 'done',
  // Prepositions / conjunctions
  'with', 'from', 'into', 'onto', 'upon', 'over', 'under', 'about',
  'than', 'then', 'when', 'also', 'more', 'some',
  // Common filler words
  'just', 'like', 'very', 'make', 'need', 'want', 'page', 'section',
  'please', 'hello', 'thanks', 'thank', 'regards', 'dear', 'kind',
  'great', 'good', 'okay', 'sure', 'fine', 'well', 'much', 'many',
  'each', 'every', 'both', 'same', 'another', 'other', 'what', 'which',
]);

// ---------------------------------------------------------------------------
// tokenize
// Converts free text into a set of candidate match words.
//
// PRD §18 specifies: "word of 4 or more letters"
//   → Only tokens that are ALL letters (a–z) are included.
//     Mixed tokens such as "auth2" or "v2.0" do not qualify as "letters".
//   → Minimum length: 4 letters.
//   → Words on the stop word list are excluded.
// ---------------------------------------------------------------------------

/** @param {string} text @returns {Set<string>} */
const tokenize = (text) => {
  if (!text || typeof text !== 'string') return new Set();

  const words = text
    .toLowerCase()           // normalise case first
    .split(/[^a-z]+/)        // split on anything that is NOT a letter
    .filter(
      (word) =>
        word.length >= 4 &&  // PRD: "4 or more letters"
        !STOP_WORDS.has(word) // PRD: "excluding a fixed stop word list"
    );

  return new Set(words);
};

// ---------------------------------------------------------------------------
// classify
//
// Branch A (tag present, matches a scope tag)   → in_scope
// Branch B (tag present, matches no scope tag)  → unclear
// Branch C (no tag, no letter-word overlap)     → possible_extra
// Branch D (no tag, at least one letter-word overlap) → unclear
// ---------------------------------------------------------------------------

/**
 * @param {string}      requestText  - The client's submitted request text
 * @param {string|null} categoryTag  - Optional category tag supplied by client;
 *                                    null/undefined/empty string = not supplied
 * @param {Array<{title: string, description: string, categoryTag: string}>} scopeItems
 *                                  - Scope items for the project
 * @returns {'in_scope'|'possible_extra'|'unclear'}
 */
const classify = (requestText, categoryTag, scopeItems) => {
  // Normalise tag: treat empty string as "no tag"
  const normalizedTag =
    categoryTag && typeof categoryTag === 'string' && categoryTag.trim()
      ? categoryTag.trim().toLowerCase()
      : null;

  // Collect all scope item tags, lowercased for comparison
  const scopeTags = scopeItems.map((item) =>
    item.categoryTag.toLowerCase()
  );

  // ── Branch A & B: category tag is present ───────────────────────────────
  if (normalizedTag !== null) {
    const tagMatch = scopeTags.some((tag) => tag === normalizedTag);
    return tagMatch ? 'in_scope' : 'unclear';
  }

  // ── Branch C & D: no category tag — keyword comparison ──────────────────
  const requestWords = tokenize(requestText);

  // Build the full corpus of scope item titles and descriptions
  const scopeCorpusText = scopeItems
    .map((item) => `${item.title} ${item.description || ''}`)
    .join(' ');
  const scopeWords = tokenize(scopeCorpusText);

  // Check for overlap (any single qualifying word in common)
  const hasOverlap = [...requestWords].some((word) => scopeWords.has(word));

  return hasOverlap ? 'unclear' : 'possible_extra';
};

module.exports = { classify, tokenize };
