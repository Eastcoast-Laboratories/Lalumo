# Lalumo App Feedback System Documentation

## Overview

The Lalumo app uses a centralized feedback system to provide consistent user feedback across all activities. This document explains how the feedback system works and how to use it in your code.

## Key Components

### 1. Unified Feedback Message Function

The core of the feedback system is the `showFeedbackMessage()` function in `/src/components/shared/feedback.js`. This function handles all types of messages:

- **Intro/Help Messages**: Contextual help that can be disabled via settings
- **Game Feedback**: Always-visible feedback during gameplay (correct/incorrect answers)

### 2. Global Alpine.js Store

Feedback state is managed through an Alpine.js store:

- `$store.feedback.showFeedback`: Controls visibility of feedback message
- `$store.feedback.feedbackMessage`: The message content
- `$store.feedback.isCorrect`: Optional status (true=correct, false=incorrect, null=neutral)

### 3. DOM Element

All feedback messages are displayed in a single global element:

```html
<div id="unified-feedback-message" 
     x-show="$store.feedback.showFeedback" 
     :class="{'correct': $store.feedback.isCorrect === true, 'incorrect': $store.feedback.isCorrect === false}">
  <span x-text="$store.feedback.feedbackMessage"></span>
</div>
```

## Using the Feedback System

### Showing a Help/Intro Message

For messages that should respect the user's help settings:

```javascript
window.showFeedbackMessage("This is a help message", {
  activityId: "1_1_pitches_high_or_low",
  isIntroMessage: true,  // Will check user settings before showing
  delaySeconds: 3,
  component: this  // Optional, for text-to-speech
});
```

### Showing Game Feedback

For gameplay feedback that should always be shown:

```javascript
window.showFeedbackMessage("Great job! That's correct!", {
  activityId: "1_1_pitches_high_or_low",
  isIntroMessage: false,  // Will ALWAYS show, ignoring settings
  isCorrect: true,  // Adds "correct" CSS class
  delaySeconds: 2
});
```

```javascript
window.showFeedbackMessage("That's not quite right. Try again!", {
  activityId: "1_1_pitches_high_or_low",
  isIntroMessage: false,
  isCorrect: false,  // Adds "incorrect" CSS class
  delaySeconds: 2
});
```

### Activity Intro Messages

For showing intro messages for activities, use the dedicated helper function:

```javascript
window.showActivityIntroMessage("1_1_pitches_high_or_low", this, 10);
```

This will:
- Look up the appropriate message from strings.xml
- Track which messages have been shown this session
- Only show each intro once per session (unless forced with the last parameter)
- Respect the user's help settings

## User Settings

Help/intro messages respect the user's preference:

- Setting is stored in `$store.helpSettings.showHelpMessages`
- Setting is persisted in localStorage as `lalumo_help_settings`
- Users can toggle this setting via the application settings UI

## Text-to-Speech Support

Intro/help messages can be spoken if:
- The component has a `speak()` method, OR
- Browser Speech Synthesis is available AND `$store.helpSettings.enableSpeech` is true

## Legacy Support

For backward compatibility, the older function signatures are maintained:

```javascript
// Legacy function, forwards to the new unified function
window.showGameFeedback(message, isCorrect, delaySeconds, activityId);
```

## Best Practices

1. Always specify an `activityId` for logging and tracking
2. Use `isIntroMessage: true` for help/intro messages, `false` for game feedback
3. Set appropriate `isCorrect` status for game feedback to get correct styling
4. Use an appropriate `delaySeconds` timeout (2-3 seconds is standard)
5. Add new message strings to `strings.xml` rather than hardcoding them
