const test = require('node:test');
const assert = require('node:assert');
const { normalizeText, levenshteinDistance, sanitizeNickname, createWordMask } = require('../src/utils');
const { getRandomWords } = require('../src/words');

test('normalizeText handles whitespace, casing, accents, punctuation', () => {
  assert.strictEqual(normalizeText('  Crème   Brûlée! '), 'creme brulee');
  assert.strictEqual(normalizeText('Ice-Cream'), 'ice-cream');
});

test('levenshteinDistance computes edit distance correctly', () => {
  assert.strictEqual(levenshteinDistance('apple', 'appl'), 1);
  assert.strictEqual(levenshteinDistance('banana', 'banan'), 1);
  assert.strictEqual(levenshteinDistance('banana', 'banana'), 0);
  assert.strictEqual(levenshteinDistance('cat', 'dog'), 3);
});

test('sanitizeNickname trims, length-limits, and filters profanity', () => {
  assert.strictEqual(sanitizeNickname('  Alice  '), 'Alice');
  assert.strictEqual(sanitizeNickname('A'.repeat(25)), 'A'.repeat(16));
  assert.strictEqual(sanitizeNickname('fuck'), 'Player');
  assert.strictEqual(sanitizeNickname(''), 'Player');
});

test('createWordMask masks letters and reveals specified indexes', () => {
  const word = 'ice cream';
  assert.strictEqual(createWordMask(word, new Set([0, 4])), 'I _ _   C _ _ _ _');
});

test('getRandomWords returns requested number of unique words', () => {
  const words = getRandomWords(3, 'default');
  assert.strictEqual(words.length, 3);
  assert.strictEqual(new Set(words).size, 3);
});
