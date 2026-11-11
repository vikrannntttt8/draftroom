// DraftRoom Word Banks

const WORD_BANK = {
  easy: [
    'apple', 'ball', 'cat', 'dog', 'sun', 'tree', 'book', 'car', 'fish', 'house',
    'moon', 'star', 'cup', 'hat', 'shoe', 'clock', 'door', 'bed', 'bird', 'boat',
    'cake', 'chair', 'duck', 'egg', 'frog', 'hand', 'key', 'leaf', 'milk', 'nose',
    'pen', 'ring', 'sock', 'table', 'bell', 'cloud', 'drum', 'fork', 'gate', 'kite',
    'lamp', 'nest', 'pizza', 'rain', 'ship', 'tent', 'wall', 'eye', 'smile', 'flower',
    'banana', 'cookie', 'brush', 'spoon', 'bone', 'heart', 'shirt', 'pants', 'candy',
    'flag', 'grass', 'lion', 'bear', 'mouse', 'snake', 'rabbit',
    'spider', 'turtle', 'pencil', 'box', 'window', 'ladder', 'broom', 'balloon', 'coin',
    'crown', 'fire', 'water', 'sand', 'snow', 'boot', 'glove', 'scarf',
    'train', 'bus', 'truck', 'plane', 'bike', 'wheel', 'road', 'hill', 'river', 'bridge'
  ],
  default: [
    'airplane', 'anchor', 'backpack', 'banana', 'bicycle', 'bridge', 'butterfly',
    'camera', 'candle', 'castle', 'cheese', 'compass', 'crown', 'diamond', 'dinosaur',
    'dolphin', 'dragon', 'elephant', 'fire hydrant', 'flashlight', 'giraffe', 'guitar',
    'hamburger', 'helicopter', 'ice cream', 'island', 'jellyfish', 'kangaroo', 'lighthouse',
    'mailbox', 'mermaid', 'microscope', 'mountain', 'octopus', 'paintbrush', 'parachute',
    'penguin', 'pirate', 'popcorn', 'rainbow', 'rocket', 'sandwich', 'scarecrow', 'scissors',
    'skateboard', 'snowman', 'spider web', 'submarine', 'telescope', 'treasure map',
    'umbrella', 'volcano', 'windmill', 'wizard', 'zebra', 'astronaut', 'hot dog', 'roller coaster',
    'accordion', 'alien', 'alligator', 'ambulance', 'aquarium', 'archery', 'armchair',
    'badminton', 'bakery', 'barbecue', 'baseball', 'basketball', 'battleship', 'beehive',
    'binoculars', 'boomerang', 'bowling', 'cactus', 'calculator', 'campfire', 'canoe',
    'carousel', 'caterpillar', 'chameleon', 'champagne', 'chess', 'chimney', 'cinnamon roll',
    'clown', 'coffee maker', 'detective', 'diving board', 'doughnut', 'dumbbell', 'easel',
    'electric guitar', 'escalator', 'flamingo', 'fountain', 'geyser', 'glacier', 'golf cart',
    'graffiti', 'harmonica', 'hedgehog', 'horseshoe', 'hot air balloon', 'hourglass', 'igloo',
    'jack-o-lantern', 'kaleidoscope', 'koala', 'lawnmower', 'leprechaun', 'limousine',
    'lobster', 'locomotive', 'magic wand', 'magnet', 'marshmallow', 'megaphone', 'meteor',
    'motorcycle', 'mummy', 'origami', 'ostrich', 'pancake', 'peacock', 'platypus', 'polar bear',
    'potion', 'pretzel', 'puppet', 'radar', 'radio', 'safari', 'sandcastle', 'saxophone',
    'satellite', 'scuba diver', 'seahorse', 'seesaw', 'sloth', 'snorkel', 'stethoscope',
    'sunflower', 'surfboard', 'sushi', 'sword', 'tamale', 'teapot', 'toaster', 'tornado',
    'traffic light', 'trampoline', 'treasure chest', 'tuba', 'unicycle', 'vampire', 'waffle',
    'walrus', 'waterfall', 'werewolf', 'wheelbarrow', 'yo-yo', 'zeppelin', 'zombie'
  ],
  hard: [
    'black hole', 'time travel', 'constellation', 'evolution', 'photosynthesis',
    'gravity', 'parallel universe', 'labyrinth', 'hologram', 'solar eclipse',
    'superhero', 'hypnosis', 'whirlpool', 'metamorphosis', 'archaeology',
    'hibernation', 'avalanche', 'mirage', 'sandstorm',
    'mona lisa', 'bermuda triangle', 'quicksand', 'thunderstorm',
    'cryptocurrency', 'teleportation', 'deep sea', 'fossil fuel', 'renaissance',
    'artificial intelligence', 'quantum entanglement', 'silent disco', 'schrodinger cat',
    'optical illusion', 'existential crisis', 'déjà vu', 'food chain', 'plate tectonics',
    'virtual reality', 'haunted mansion', 'solar flare', 'supernova', 'crop circle',
    'golden ratio', 'abominable snowman', 'fata morgana', 'turing test', 'escape room',
    'sound barrier', 'subconscious', 'brainstorm', 'fossilization', 'doppelganger',
    'speed of light', 'space elevator', 'butterfly effect', 'pandora box', 'terraforming'
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
