/**
 * Shared chord mapping utilities for chord activities
 */

/**
 * Get the chord type mapping for visual elements to chord types
 * @returns {Object} Mapping of visual elements to chord types
 */
export function getChordMapping() {
  return {
    'fruit': 'major',
    'mushroom': 'minor', 
    'crystal': 'diminished',
    'flower': 'augmented',
    'flame': 'dominant7',
    'feather': 'major7',
    'acorn': 'sus2',
    'lantern': 'sus4'
  };
}

/**
 * Get chord intervals for a given chord type
 * @param {string} chordType - The chord type (e.g., 'major', 'minor', 'diminished')
 * @returns {number[]} Array of intervals in semitones from root
 */
export function getChordIntervals(chordType) {
    const chordIntervals = {
        'major': [0, 4, 7],
        'minor': [0, 3, 7],
        'diminished': [0, 3, 6],
        'augmented': [0, 4, 8],
        'dominant7': [0, 4, 7, 10],
        'major7': [0, 4, 7, 11],
        'sus2': [0, 2, 7],
        'sus4': [0, 5, 7]
    };
    return chordIntervals[chordType] || [0, 4, 7];
}

/**
 * Get magical element for chord type
 * @param {string} chordType - The chord type
 * @returns {string} The corresponding magical element
 */
export function getElementForChordType(chordType) {
    const mapping = {
        'major': 'fruit',
        'minor': 'mushroom',
        'diminished': 'crystal', 
        'augmented': 'flower',
        'dominant7': 'flame',
        'major7': 'feather',
        'sus2': 'acorn',
        'sus4': 'lantern'
    };
    return mapping[chordType] || 'fruit';
}

/**
 * Get the reverse mapping from chord types to visual elements
 * @returns {Object} Mapping of chord types to visual elements
 */
export function getChordTypeToIconMapping() {
  const chordMapping = getChordMapping();
  const reverseMapping = {};
  
  for (const [icon, chordType] of Object.entries(chordMapping)) {
    reverseMapping[chordType] = icon;
  }
  
  return reverseMapping;
}

/**
 * Get chord type from visual element
 * @param {string} element - Visual element name
 * @returns {string|null} Chord type or null if not found
 */
export function getChordTypeFromElement(element) {
  const mapping = getChordMapping();
  return mapping[element] || null;
}

/**
 * Get visual element from chord type
 * @param {string} chordType - Chord type
 * @returns {string|null} Visual element or null if not found
 */
export function getElementFromChordType(chordType) {
  const mapping = getChordTypeToIconMapping();
  return mapping[chordType] || null;
}
