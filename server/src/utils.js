// DraftRoom utility functions

// Code charset excluding easily confused characters: I, O, 1, 0
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRoomCode(existingCodes) {
  let code = '';
  for (let attempt = 0; attempt < 100; attempt++) {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    if (!existingCodes.has(code)) {
      return code;
    }
  }
  // Fallback 5-char if somehow saturated
  return code + CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
}

function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // remove punctuation except space and hyphen
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],    // deletion
          dp[i][j - 1],    // insertion
          dp[i - 1][j - 1] // substitution
        );
      }
    }
  }

  return dp[m][n];
}

const PROFANITY_LIST = new Set([
  'anal', 'anus', 'ass', 'bitch', 'blowjob', 'clit', 'cock', 'cunt', 'dick',
  'dildo', 'fuck', 'fucker', 'nigger', 'nigga', 'penis', 'piss', 'pussy',
  'shit', 'slut', 'tit', 'twat', 'vagina', 'whore'
]);

function isProfane(text) {
  if (!text) return false;
  const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
  for (const word of PROFANITY_LIST) {
    if (cleaned.includes(word)) return true;
  }
  return false;
}

function sanitizeNickname(rawNickname) {
  if (!rawNickname || typeof rawNickname !== 'string') return 'Player';
  let cleaned = rawNickname.trim().replace(/\s+/g, ' ');
  if (cleaned.length < 2) cleaned = 'Player';
  if (cleaned.length > 16) cleaned = cleaned.substring(0, 16).trim();
  if (isProfane(cleaned)) cleaned = 'Player';
  return cleaned;
}

function createWordMask(word, revealedIndexes = new Set()) {
  if (!word) return '';
  let globalIndex = 0;
  const parts = word.split(' ');
  return parts
    .map(part => {
      const maskedPart = part.split('').map(char => {
        const currIdx = globalIndex++;
        if (char === '-') return '-';
        if (revealedIndexes.has(currIdx)) return char.toUpperCase();
        return '_';
      }).join(' ');
      globalIndex++; // for the space character
      return maskedPart;
    })
    .join('   ');
}

function getWordLengths(word) {
  if (!word) return [];
  return word.split(' ').map(w => w.length);
}

function checkWordMatch(guess, target) {
  const normGuess = normalizeText(guess);
  const normTarget = normalizeText(target);
  if (!normGuess || !normTarget) return false;

  // Exact match
  if (normGuess === normTarget) return true;

  // Simple plural / singular variants (e.g. cat/cats, apple/apples, box/boxes)
  if (normGuess + 's' === normTarget || normTarget + 's' === normGuess) return true;
  if (normGuess + 'es' === normTarget || normTarget + 'es' === normGuess) return true;

  return false;
}

module.exports = {
  CODE_CHARS,
  generateRoomCode,
  normalizeText,
  levenshteinDistance,
  checkWordMatch,
  isProfane,
  sanitizeNickname,
  createWordMask,
  getWordLengths
};
