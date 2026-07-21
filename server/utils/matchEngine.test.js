/**
 * matchEngine.test.js
 *
 * Unit tests for server/utils/matchEngine.js
 * Every test case maps directly to a PRD §18 rule or §27 acceptance criterion.
 *
 * Run with: node server/utils/matchEngine.test.js
 * No test framework required — uses Node.js assert only.
 */

'use strict';

const assert = require('assert');
const { classify, tokenize } = require('./matchEngine');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌  ${name}`);
    console.error(`       Expected: ${err.expected}`);
    console.error(`       Actual  : ${err.actual}`);
    console.error(`       Message : ${err.message}`);
    failed++;
  }
}

// ── Sample scope items ─────────────────────────────────────────────────────
const scopeItems = [
  { title: 'User authentication flow', description: 'Login and registration pages', categoryTag: 'backend' },
  { title: 'Landing page design',      description: 'Hero section and pricing',    categoryTag: 'design' },
  { title: 'Payment integration',      description: 'Stripe checkout setup',       categoryTag: 'payment' },
];

// ═══════════════════════════════════════════════════════════════════════
// tokenize() tests
// PRD: "word of 4 or more letters, excluding a fixed stop word list"
// ═══════════════════════════════════════════════════════════════════════
console.log('\ntokenize() — PRD §18 letter-word rules');

test('returns a Set', () => {
  assert(tokenize('hello world') instanceof Set);
});

test('lowercases tokens', () => {
  const result = tokenize('Authentication FLOW');
  assert(result.has('authentication'));
  assert(result.has('flow'));
});

test('excludes tokens shorter than 4 letters', () => {
  const result = tokenize('add new tab row');
  assert(!result.has('add'));
  assert(!result.has('new'));
  assert(!result.has('tab'));
  assert(!result.has('row'));
});

test('includes tokens exactly 4 letters long', () => {
  const result = tokenize('chat page form auth');
  assert(result.has('chat'));
  assert(result.has('form'));
  assert(result.has('auth'));
});

test('excludes stop words (e.g. "with", "that", "will")', () => {
  const result = tokenize('this will have more than just that with them');
  assert(!result.has('this'));
  assert(!result.has('will'));
  assert(!result.has('have'));
  assert(!result.has('more'));
  assert(!result.has('than'));
  assert(!result.has('just'));
  assert(!result.has('that'));
  assert(!result.has('with'));
  assert(!result.has('them'));
});

test('PRD fix: excludes mixed letter+digit tokens like "auth2"', () => {
  // PRD says "word of 4 or more LETTERS" — not letters+digits
  const result = tokenize('auth2 v2api rest2');
  assert(!result.has('auth2'), '"auth2" must not be a qualifying letter-word');
  assert(!result.has('rest2'), '"rest2" must not be a qualifying letter-word');
});

test('PRD fix: excludes pure-digit tokens', () => {
  const result = tokenize('4000 1234 2024');
  assert(!result.has('4000'));
  assert(!result.has('1234'));
});

test('splits on hyphens, dots, underscores, spaces', () => {
  // "user-auth" → ["user", "auth"] both ≥4 letters
  const result = tokenize('user-auth landing_page api.endpoint');
  assert(result.has('user'));
  assert(result.has('auth'));
  assert(result.has('landing'));
  assert(result.has('endpoint'));
});

test('returns empty set for empty string', () => {
  assert.strictEqual(tokenize('').size, 0);
});

test('returns empty set for null/undefined', () => {
  assert.strictEqual(tokenize(null).size, 0);
  assert.strictEqual(tokenize(undefined).size, 0);
});

test('deduplicates repeated words (Set behaviour)', () => {
  const result = tokenize('login login login authentication');
  assert.strictEqual([...result].filter(w => w === 'login').length, 1);
});

// ═══════════════════════════════════════════════════════════════════════
// classify() — Branch A
// PRD: "A request is classified in_scope when its category tag equals
//       the category tag of an existing scope item."
// §27 AC: "A request with a category tag matching an existing scope item
//           is classified in_scope."
// ═══════════════════════════════════════════════════════════════════════
console.log('\nclassify() — Branch A: tag match → in_scope');

test('exact tag match → in_scope', () => {
  assert.strictEqual(classify('Please add login', 'backend', scopeItems), 'in_scope');
});

test('tag match is case-insensitive (uppercase input)', () => {
  assert.strictEqual(classify('Update the design', 'DESIGN', scopeItems), 'in_scope');
});

test('tag match is case-insensitive (mixed case input)', () => {
  assert.strictEqual(classify('Stripe setup', 'Payment', scopeItems), 'in_scope');
});

test('tag match ignores leading/trailing whitespace', () => {
  assert.strictEqual(classify('anything', '  backend  ', scopeItems), 'in_scope');
});

test('tag match: text content is irrelevant when tag matches', () => {
  // Even if request text has zero overlap with scope, tag match wins
  assert.strictEqual(
    classify('xkzqwerty frobnicate', 'backend', scopeItems),
    'in_scope'
  );
});

// ═══════════════════════════════════════════════════════════════════════
// classify() — Branch B
// PRD: "A request is classified unclear when it has a category tag that
//       does not match any scope item tag"
// ═══════════════════════════════════════════════════════════════════════
console.log('\nclassify() — Branch B: tag present but no match → unclear');

test('tag present, no match → unclear', () => {
  assert.strictEqual(classify('Deploy to cloud', 'devops', scopeItems), 'unclear');
});

test('close-but-not-exact tag → unclear (not fuzzy)', () => {
  // "backends" ≠ "backend"
  assert.strictEqual(classify('Add endpoint', 'backends', scopeItems), 'unclear');
});

test('empty-string tag treated as no-tag (keyword path, not Branch B)', () => {
  // Empty string → normalizedTag is null → falls through to keyword check
  // "authentication" overlaps → unclear (Branch D)
  const result = classify('Need authentication feature', '', scopeItems);
  assert.notStrictEqual(result, undefined);
  // Should be unclear because "authentication" overlaps scope items
  assert.strictEqual(result, 'unclear');
});

// ═══════════════════════════════════════════════════════════════════════
// classify() — Branch C
// PRD: "A request is classified possible_extra when it has no category
//       tag and shares no word of 4 or more letters, excluding a fixed
//       stop word list, with any scope item title or description."
// §27 AC: "A request with no matching tag and no keyword overlap is
//           classified possible_extra."
// ═══════════════════════════════════════════════════════════════════════
console.log('\nclassify() — Branch C: no tag, no overlap → possible_extra');

test('no tag, zero keyword overlap → possible_extra', () => {
  assert.strictEqual(
    classify('Please send invoice to client', null, scopeItems),
    'possible_extra'
  );
});

test('no tag, only stop-word overlap → possible_extra (stop words excluded)', () => {
  // "with", "more", "just" are stop words → no qualifying overlap
  assert.strictEqual(
    classify('With more just than that will have been', null, scopeItems),
    'possible_extra'
  );
});

test('no tag, short-word overlap only → possible_extra (words < 4 letters excluded)', () => {
  // "new", "add", "set" are all < 4 letters → no qualifying overlap
  assert.strictEqual(
    classify('New set add few top', null, scopeItems),
    'possible_extra'
  );
});

test('no tag, mixed digit+letter tokens do not count as overlap', () => {
  // "auth2" shares "auth" letters but is not a qualifying word
  assert.strictEqual(
    classify('auth2 rest2 api2', null, scopeItems),
    'possible_extra'
  );
});

test('no tag, undefined → same as null (no tag path)', () => {
  const result = classify('Send final invoice pdf', undefined, scopeItems);
  assert.strictEqual(result, 'possible_extra');
});

test('no scope items at all → no overlap possible → possible_extra', () => {
  assert.strictEqual(classify('Any text here', null, []), 'possible_extra');
});

// ═══════════════════════════════════════════════════════════════════════
// classify() — Branch D
// PRD: "A request is classified unclear when … it has no category tag
//       but shares at least one word of 4 or more letters with a scope
//       item title or description."
// ═══════════════════════════════════════════════════════════════════════
console.log('\nclassify() — Branch D: no tag, keyword overlap → unclear');

test('no tag, word "authentication" overlaps scope title → unclear', () => {
  assert.strictEqual(
    classify('I need authentication support', null, scopeItems),
    'unclear'
  );
});

test('no tag, word "landing" overlaps scope title → unclear', () => {
  assert.strictEqual(
    classify('Update the landing layout', null, scopeItems),
    'unclear'
  );
});

test('no tag, word "stripe" overlaps scope description → unclear', () => {
  // "stripe" is in description of payment scope item
  assert.strictEqual(
    classify('I want Stripe connected', null, scopeItems),
    'unclear'
  );
});

test('no tag, word "checkout" overlaps scope description → unclear', () => {
  assert.strictEqual(
    classify('checkout button broken', null, scopeItems),
    'unclear'
  );
});

test('no tag, overlap via description word "registration" → unclear', () => {
  assert.strictEqual(
    classify('Fix the registration form', null, scopeItems),
    'unclear'
  );
});

test('no tag, overlap via description word "pricing" → unclear', () => {
  assert.strictEqual(
    classify('Update pricing display', null, scopeItems),
    'unclear'
  );
});

test('single overlapping word is sufficient → unclear', () => {
  // "payment" appears in scope title
  assert.strictEqual(
    classify('Xyzqwerty payment frob', null, scopeItems),
    'unclear'
  );
});

// ═══════════════════════════════════════════════════════════════════════
// Edge cases & invariants
// ═══════════════════════════════════════════════════════════════════════
console.log('\nEdge cases');

test('always returns one of the three valid classifications', () => {
  const valid = new Set(['in_scope', 'possible_extra', 'unclear']);
  const cases = [
    classify('test', null, scopeItems),
    classify('test', 'backend', scopeItems),
    classify('test', 'unknown', scopeItems),
    classify('authentication login registration', null, scopeItems),
  ];
  cases.forEach((result) => assert(valid.has(result), `Invalid result: ${result}`));
});

test('classification is deterministic (same inputs → same output every call)', () => {
  const a = classify('Need invoice functionality', null, scopeItems);
  const b = classify('Need invoice functionality', null, scopeItems);
  assert.strictEqual(a, b);
});

test('does not mutate scopeItems array', () => {
  const items = [
    { title: 'Dashboard page', description: '', categoryTag: 'frontend' },
  ];
  const frozen = JSON.stringify(items);
  classify('Some request text', null, items);
  assert.strictEqual(JSON.stringify(items), frozen);
});

test('handles scope items with empty description gracefully', () => {
  const items = [
    { title: 'Dashboard', description: '', categoryTag: 'frontend' },
    { title: 'Reports',   description: null, categoryTag: 'analytics' },
  ];
  // Should not throw
  const result = classify('Show dashboard metrics', null, items);
  assert.strictEqual(result, 'unclear'); // "dashboard" overlaps
});

// ─── Summary ───────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\n⚠️  Some tests failed — check the implementation.');
  process.exit(1);
} else {
  console.log('\n✅  All tests passed — match engine is PRD-compliant.');
}
