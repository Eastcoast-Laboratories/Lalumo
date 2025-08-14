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

## Proposal: Curved/Bending Segments

Goal: Make body segments visually follow bends (curvature) of the drawn path more naturally.

### Option A — JS-only approximation (piecewise micro-segments)
- __Idea__: Replace one body segment by N short sub-segments sampled along the local path window. Each sub-segment is rotated to its local tangent.
- __How__: For each logical segment center at progress p, sample k points in [p-Δ, p+Δ], compute small quads and draw sprites with slight overlaps.
- __Pros__: No new assets. Works on Canvas 2D. Gradual, smooth curvature.
- __Cons__: More draw calls. Very tight curves still look like a polyline.
- __Minimal sketch__:
  - For each body segment, compute local arc length L and choose k = clamp(L/segmentSize, 3..7).
  - Loop j=0..k-1: t = lerp(p-Δ, p+Δ, j/(k-1)), pos=path(t), ang=tangent(t). Draw sub-sprite with width≈segmentSize/k and 20–30% overlap.

### Option B — Asset-based curved sprites
- __Idea__: Provide additional curved body assets (e.g., 20°, 40°, 60°, 90° left/right) and pick by local curvature.
- __How__: Compute signed angle delta between tangents at p-ε and p+ε. Bucket to nearest curve asset and draw that instead of straight segment.
- __Pros__: Best visuals; true curvature without aliasing/stretch artifacts.
- __Cons__: Requires creating multiple assets (both directions, possibly multiple radii). More selection logic.

### Option C — Hybrid (recommended)
- __Idea__: Use straight sprites for gentle curves via Option A (k=3..5). For strong curves (|Δθ|>θ_threshold, e.g. 35°), switch to a curved asset from Option B.
- __Pros__: Keeps asset count moderate while improving visuals in the cases where straight sprites break down.
- __Cons__: Some integration complexity (curvature detection + asset selection).

### Implementation Notes
- __Curvature metric__: Δθ = angle(p+ε) - angle(p-ε), normalized to [-π, π]. Use small ε by arc length (e.g., 12–20 px) so the metric is stable.
- __Performance__: Limit total sub-segments per frame (e.g., cap at 120). Reduce k on low FPS.
- __Z-order__: Draw tail→head as today. Sub-segments inherit the same ordering.
- __Opacity__: Keep `ctx.globalAlpha = 1.0` inside segment draw to avoid inheriting marker transparency.
- __Assets__: If adopting B/Hybrid, add files under `public/images/snake/` like `green_curve_30_l.png`, `green_curve_60_r.png`.

### Rollout Plan
1) Implement Option A with k=3 for body segments only. no flag no legacy support no fallbacks
2) Tune thresholds, overlaps, and k.
