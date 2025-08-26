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
 * Test script to verify chord modules are working correctly
 */

// Import debug utility
import { debugLog } from '../utils/debug.js';

// Import test functions from individual modules (direct imports)
import { testCommonModuleImport } from './2_chords/common.js';
import { testChordColorMatchingModuleImport } from './2_chords/2_1_chord_color_matching.js';
import { testChordBuildingModuleImport } from './2_chords/2_3_chord_building.js';
import { testMissingNoteModuleImport } from './2_chords/2_4_missing_note.js';
import { testChordCharactersModuleImport } from './2_chords/2_5_chord_characters.js';

// Run all test functions
debugLog('TEST', 'Testing chord module imports:');
testCommonModuleImport();
testChordColorMatchingModuleImport();
testChordBuildingModuleImport();
testMissingNoteModuleImport();
testChordCharactersModuleImport();
debugLog('TEST', 'All chord module tests completed!');
