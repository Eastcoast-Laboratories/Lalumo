# Snake Animation — Implementation Strategy (Final)

## Overview
Replace the blue path rendering in the Draw Melody activity with a snake animation that follows the user’s drawn path while the melody plays. Integration is minimal and reuses the existing playback/progress logic.

## Assets
- Location: `public/images/snake/`
- Files (JPEG, ~70% quality):
  - `green_open.jpg` and `green_close.jpg` (alternating heads)
  - `green_segment1.jpg`, `green_segment2.jpg` (body)
  - `green_tail.jpg` (tail)

## Implemented Modules
- `src/components/pitches/1_3_draw_melody.js`
  - Exports:
    - `initSnakeAnimation()` — preloads images
    - `drawSnakeAnimation(canvas, path, progress, isPlaying)` — draws snake along path

## Minimal Integration (no reimplementation of existing logic)
- File: `src/components/pitches.js`
  - Import at top:
    ```js
    import { drawSnakeAnimation, initSnakeAnimation } from './pitches/1_3_draw_melody.js';
    ```
  - Initialize once in `init()`:
    ```js
    initSnakeAnimation();
    ```
  - In `redrawMelody()` replace the line drawing with:
    ```js
    const progress = this.drawPath.length > 0 ? playedPathLength / this.drawPath.length : 0;
    const isPlaying = this.currentPlaybackIndex >= 0;
    drawSnakeAnimation(canvas, this.drawPath, progress, isPlaying);
    ```
  - All other behavior remains unchanged:
    - Guide lines, note markers/labels, sampling/progress logic

## Behavior Details
- Follows the existing `this.drawPath` exactly.
- Head alternates open/close during playback (~200ms cadence).
- First body segment after head is always `segment2`, subsequent segments are a pseudo-random mix of `segment1/segment2`.
- Tail appears when the snake has grown to sufficient length.
- Rotation aligns with path direction; size tuned for canvas usage.

## Testing Notes
- Use the Draw Melody activity, draw a path, and start playback.
- Verify: snake follows path, grows with progress, head alternates, markers remain visible.
- Watch console for `SNAKE_ANIMATION` debug logs.

## Out of Scope (removed from draft)
- Redundant step-by-step speculative plan, requestAnimationFrame orchestration, and duplicate canvas management — existing component logic remains the single source of truth.
