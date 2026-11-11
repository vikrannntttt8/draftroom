// DraftRoom Word Banks

const WORD_BANK = {
  easy: [
    'apple', 'ball', 'cat', 'dog', 'sun', 'tree', 'book', 'car', 'fish', 'house',
    'moon', 'star', 'cup', 'hat', 'shoe', 'clock', 'door', 'bed', 'bird', 'boat',
    'cake', 'chair', 'duck', 'egg', 'frog', 'hand', 'key', 'leaf', 'milk', 'nose',
    'pen', 'ring', 'sock', 'table', 'bell', 'cloud', 'drum', 'fork', 'gate', 'kite',
    'lamp', 'nest', 'pizza', 'rain', 'ship', 'tent', 'wall', 'eye', 'smile', 'flower'
  ],
  default: [
    'airplane', 'anchor', 'backpack', 'banana', 'bicycle', 'bridge', 'butterfly',
    'camera', 'candle', 'castle', 'cheese', 'compass', 'crown', 'diamond', 'dinosaur',
    'dolphin', 'dragon', 'elephant', 'fire hydrant', 'flashlight', 'giraffe', 'guitar',
    'hamburger', 'helicopter', 'ice cream', 'island', 'jellyfish', 'kangaroo', 'lighthouse',
    'mailbox', 'mermaid', 'microscope', 'mountain', 'octopus', 'paintbrush', 'parachute',
    'penguin', 'pirate', 'popcorn', 'rainbow', 'rocket', 'sandwich', 'scarecrow', 'scissors',
    'skateboard', 'snowman', 'spider web', 'submarine', 'telescope', 'treasure map',
    'umbrella', 'volcano', 'windmill', 'wizard', 'zebra', 'astronaut', 'hot dog', 'roller coaster'
  ],
  hard: [
    'black hole', 'time travel', 'constellation', 'evolution', 'photosynthesis',
    'gravity', 'parallel universe', 'labyrinth', 'hologram', 'solar eclipse',
    'superhero', 'hypnosis', 'whirlpool', 'metamorphosis', 'archaeology',
    'hibernation', 'avalanche', 'mirage', 'chameleon', 'sandstorm', 'constellation',
    'mona lisa', 'bermuda triangle', 'roller coaster', 'quicksand', 'thunderstorm',
    'cryptocurrency', 'teleportation', 'deep sea', 'fossil fuel', 'renaissance'
  ]
};

function getRandomWords(count = 3, wordSet = 'default', customWords = [], usedWords = new Set()) {
  let pool = [];

  if (wordSet === 'custom-only') {
    pool = [...customWords];
  } else if (wordSet === 'default+custom') {
    pool = [...(WORD_BANK.default || []), ...(WORD_BANK.easy || []), ...customWords];
  } else if (wordSet === 'easy') {
    pool = [...WORD_BANK.easy];
  } else if (wordSet === 'hard') {
    pool = [...WORD_BANK.hard];
  } else {
    // default (mixed easy & default)
    pool = [...WORD_BANK.default, ...WORD_BANK.easy];
  }

  // Filter out used words if possible
  let available = pool.filter(w => !usedWords.has(w.toLowerCase()));
  if (available.length < count) {
    // Reset pool if exhausted
    available = pool;
  }

  // Pick unique words
  const chosen = new Set();
  const shuffled = [...available].sort(() => 0.5 - Math.random());

  for (const word of shuffled) {
    chosen.add(word);
    if (chosen.size >= count) break;
  }

  // If still less than count, fill with default fallback
  if (chosen.size < count) {
    for (const word of WORD_BANK.easy) {
      chosen.add(word);
      if (chosen.size >= count) break;
    }
  }

  return Array.from(chosen).slice(0, count);
}

module.exports = {
  WORD_BANK,
  getRandomWords
};
