/*
 * Lalumo - Music Practice Tool
 * Copyright (C) 2024 Ruben Barkow-Kuder
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Musical note utilities for MIDI to note name conversion and transposition
 */

// Standard chromatic scale note names
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Converts a MIDI note number to a note name with octave
 * @param {number} midiNote - MIDI note number (0-127)
 * @returns {string} Note name with octave (e.g., 'C4')
 */
export function midiToNoteName(midiNote) {
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = NOTE_NAMES[midiNote % 12];
  return `${noteName}${octave}`;
}

/**
 * Transposes a note by the specified number of semitones
 * @param {string} note - The note to transpose (e.g., 'C4')
 * @param {number} semitones - Number of semitones to transpose (can be positive or negative)
 * @returns {string} Transposed note
 */
export function transposeNote(note, semitones) {
  if (semitones === 0) return note;
  
  // Parse the note name and octave
  const noteMatch = note.match(/^([A-G]#?)(-?\d+)$/);
  if (!noteMatch) return note; // Return original if format is invalid
  
  const [, noteName, octave] = noteMatch;
  
  // Find the index of the note in the chromatic scale
  let noteIndex = NOTE_NAMES.indexOf(noteName);
  if (noteIndex === -1) return note; // Return original if note name is invalid
  
  // Calculate new note index and octave
  let newNoteIndex = (noteIndex + semitones) % 12;
  if (newNoteIndex < 0) newNoteIndex += 12;
  
  let newOctave = parseInt(octave, 10) + Math.floor((noteIndex + semitones) / 12);
  
  return `${NOTE_NAMES[newNoteIndex]}${newOctave}`;
}