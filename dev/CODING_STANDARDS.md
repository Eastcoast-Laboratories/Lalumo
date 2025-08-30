# CODING_STANDARDS

## Activity Visual & Audio Feedback Standards

### to create a new activity:
reuse those functionalities from 2_5:

- each activity has a free play mode where you just click buttons and listen and a game mode where you have to listen and click the right buttons
- reset functionality in the nav button works
- reset all progress function works
- success rainbow and success sound
- when pressing the wrong button
 - play the error melody and show the shake error animation
 - show correct correct button in green
- make sure the progress works and is saved
- make sure the progress is shown in the bottom text
- make sure progress is included in game export and import in the settings screen (maybe nothing to do, cause all localstroage data is exported anyway)
- copy the background image from 2_5, i'll replace it with a new image laterr
- add a  helpMessage to the help message system
  - cheatcode works in settings
- klick auf den play button startet den game mode
- ereutes klicken auf den play button soll den akkord erneut abspielen ohne ihn zu ändern.
- falschen button click triggert die error effekte und spielt dann erneut den akkord (wie beim erneuten klicken des start buttons)

Free Play & Game Mode: Wie in 2_5, mit 🦉 Start-Button
Progress System: Speichert Fortschritt in localStorage unter '2_1' Key
Feedback System: Rainbow Success, Shake Error, Correct Button Highlighting
Reset Funktionalität: Funktioniert mit Navigation-Button Reset
Audio Integration: Verwendet zentrales Audio-System

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

#### Activity Structure
```javascript
// Each activity should follow this pattern:
export class Activity {
  handleSuccess() {
    // 1. Update progress/localStorage
    // 2. Show visual feedback
    showRainbowSuccess();
    // 3. Play audio feedback  
    playSuccessSound();
    // 4. Provide user messaging
  }
  
  handleError() {
    // 1. Show visual feedback on specific element
    showShakeError(targetElement);
    // 2. Play audio feedback
    playErrorSound();
    // 3. Provide helpful guidance
  }
}
```

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
