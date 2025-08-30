# CODING_STANDARDS

## Activity Visual & Audio Feedback Standards

### How to Create a New Activity:
Follow this comprehensive checklist based on the proven 2_5 activity pattern:

#### Core Activity Structure
- **Dual Mode System**: Implement both free play mode (exploration) and game mode (challenges)
  - Free play: Click buttons to hear sounds without scoring
  - Game mode: Listen and select correct answers with progress tracking
- **Start Button**: Use this button to transition from free play to game mode
- **Play Button**: Replay current challenge without changing it (e.g. keep the transposition) (game mode only)

#### Audio & Feedback Integration
- **Central Audio Engine**: Use `playChordByType()` or equivalent from shared audio system
- **Success Feedback**: 
  - Rainbow success animation (`showRainbowSuccess()`)
  - Success sound effect
  - Progress increment
- **Error Feedback**:
  - Shake error animation (`showShakeError()`)
  - Error melody playback
  - Highlight correct button in green (`highlightCorrectButton()`)
  - Auto-replay current challenge after delay (1500ms)
- **Audio Management**: Call `stopAllSounds()` before playing new sounds

#### Progress System Implementation
- **Storage**: Save progress in localStorage under activity key (e.g., '2_1', '2_5')
- **Display**: Show progress count in bottom text using shared progress display
- **Levels**: Implement progressive difficulty if applicable (see `get_2_5_level()` pattern)
- **Export/Import**: Progress automatically included in settings export/import (localStorage based)

#### Reset Functionality
- **Activity Reset**: Implement `reset_X_Progress(component)` function
- **Integration Points**: Add reset function to:
  - `pitches/common.js` resetMethods object (both short and long keys)
  - `pitches/common.js` resetAllProgress() function
  - Import statement in common.js
  - Export from activity module and add to window object

#### Help System Integration
- **Intro Messages**: Add activity to `showActivityIntroMessage()` system
  - Add entry to stringKeyMap in `feedback.js`
  - Add fallback messages for EN/DE
  - Add strings to `strings.xml` files
- **Settings Integration**: Ensure cheat codes work in settings screen

#### File Structure & Exports
- **Module File**: Create `X_activity_name.js` in appropriate folder
- **Required Exports**:
  - `startXActivityName(component)` - Initialize free play mode
  - `startXGameMode(component)` - Switch to game mode  
  - `generateXChallenge(component)` - Create new challenge
  - `playCurrentXChallenge(component)` - Replay current challenge
  - `checkXAnswer(selection, component)` - Validate user input
  - `reset_X_Progress(component)` - Reset activity progress
- **Global Window Exports**: Make functions available for HTML Alpine.js calls

#### HTML Integration
- **Alpine.js Data**: Add activity state variables to main component
 - in index.html the component object is given to functions with `functionCall($data)` instead of `functionCall(this)`
- **Mode Switching**: Use `x-show` directives for free play/game mode visibility
- **Button Handlers**: Connect to exported functions via `@click` directives
- **Progress Display**: Include progress counter with shared styling
- **Background**: Copy background from 2_5 initially, replace later
- **Localization** Add all strings to `strings.xml` files
- 

#### Testing Requirements
- use the existing playwright test `chord-color-matching.spec.js` as template, how to create new tests
- try to work in a test-driven development way
- **Playwright Tests**: Create comprehensive test file covering:
  - Navigation to activity
   - check help message appears on top in the same manner as in 2_5
  - Free play mode functionality
  - Game mode transitions
  - Correct/incorrect answer handling
  - check if the correct sounds are played
  - check if the correct feedback is shown:
   - success:
    - rainbow
    - success sound
   - error:
    - shake
    - error sound
    - highlight correct button in green
  - Progress tracking
  - Reset functionality

#### Import Dependencies
```javascript
// Standard imports for new activities
import { debugLog } from '../../utils/debug.js';
import audioEngine from '../audio-engine.js';
import {
  showShakeError,
  showRainbowSuccess,
  highlightCorrectButton,
  showActivityIntroMessage
} from '../shared/feedback.js';
```

This checklist ensures consistent architecture, user experience, and maintainability across all activities.

### Required Feedback Elements

Every activity MUST implement consistent feedback mechanisms:

#### 1. **Visual Success Feedback**
- **Rainbow Animation**: Full-screen rainbow arc animation for successful completion
- **CSS Class**: `.rainbow-success` 
- **Duration**: 3 seconds with `rainbow-expand` animation
- **Usage**: Major achievements, level completion, perfect scores

#### 2. **Visual Error Feedback**  
- **Shake Animation**: Element-specific shake animation for errors
- **CSS Class**: `.shake-error`
- **Duration**: 0.5 seconds with `shake` animation
- **Usage**: Wrong answers, incorrect interactions

#### 3. **Audio Success Feedback**
- **Success Melody**: Ascending arpeggio (C4, E4, G4, C5)
- **Function**: `playSuccessSound()`
- **Duration**: ~0.8 seconds total
- **Usage**: Correct answers, progress milestones

#### 4. **Audio Error Feedback**
- **Error Sound**: Descending minor third (E4, C4)  
- **Function**: `playErrorSound()`
- **Duration**: ~0.8 seconds total
- **Usage**: Wrong answers, failed attempts

#### 5. **Background Styling**
- Each activity chapter should have a distinct background image
- Use `lazyload-bg` class with `data-background-image` attribute
- Background should support the learning theme and age group

### Implementation Requirements

#### Feedback Utilities Location
- **Shared Module**: `/src/components/shared/feedback.js`
- **Purpose**: Centralized feedback functions used across all chapters
- **Exports**: `showRainbowSuccess()`, `showShakeError()`, `playSuccessSound()`, `playErrorSound()`

#### Consistency Rules
- **NO custom feedback variations** - use shared utilities only
- **NO silent failures** - always provide audio + visual feedback
- **NO inconsistent timing** - respect standard durations
- **ALL activities** must use the same success/error patterns
- **ALL audio implementations** must use Tone.js

### Chapter-Specific Guidelines

#### Background Images
- **Pitches**: Bird/nature themes (`pitches_bird_sings.jpg`)
- **Chords**: Landscape/mood themes
- **Rhythm**: Movement/dance themes  
- **Melody**: Drawing/creative themes

#### Progress Tracking
- Use descriptive localStorage keys: `lalumo_[chapter]_[activity]_progress`
- Include success counters, levels, and completion status
- Reset functions must clear ALL related progress variables:
 . in preferences
 - in the navigatin button  
- in- and export must include them

## Code Quality Standards

### Import Structure
- **NO barrel exports** (`index.js` files)
- **Direct imports only** from individual modules
- **Alphabetical ordering** of import statements
- **Grouped imports**: utilities, then activities, then assets

### Function Naming
- **Reset functions**: `reset_[id]_[Activity]_Progress`
- **Setup functions**: `setup[Activity]Mode_[id]`
- **Test functions**: `test[Module]ModuleImport`

### Error Handling
- **NO failsafes** - fix root causes
- **Extensive logging** with unique tags
- **Descriptive error messages** for debugging
- **Graceful degradation** only when absolutely necessary
