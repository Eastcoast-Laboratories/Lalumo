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
 * 1_3_draw_melody.js - Module for the "Draw a Melody" activity
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

/**
 * Calculate level for Activity 1_3 (Draw Melody) based on progress
 * Replaces the old drawMelodyLevel variable with calculated level
 * @param {Object} component - The Alpine component instance
 * @returns {number} Current level (0-5)
 */
export function get_1_3_level(component) {
  const progress = component?.progress?.['1_3'] || 0;
  
  // Level progression: every 3 correct answers increases the level
  // Level 0: 0-2 correct (3 notes)
  // Level 1: 3-5 correct (4 notes)  
  // Level 2: 6-8 correct (5 notes)
  // Level 3: 9-11 correct (6 notes)
  // Level 4: 12-14 correct (7 notes)
  // Level 5: 15+ correct (8 notes)
  
  return Math.min(5, Math.floor(progress / 3));
}

// Export a test function for import tests
export function testDrawMelodyModuleImport() {
  debugLog('PITCHES', 'Draw Melody module successfully imported');
  return true;
}

/**
 * Reset Draw Melody activity progress
 * @param {Object} component - The Alpine.js component
 */
export function reset_1_3_DrawMelody_Progress(component) {
  debugLog('PITCHES', 'RESET_DRAW_MELODY: Starting reset process', {
    currentProgress: component.progress['1_3'] || 0,
    challengeMode: component.melodyChallengeMode
  });
  
  // Reset progress to 0 (level will be calculated automatically)
  if (!component.progress) component.progress = {};
  component.progress['1_3'] = 0;
  
  // Reset component variables
  component.melodyChallengeMode = false;
  component.drawPath = [];
  component.previousDrawPath = [];
  component.referenceSequence = null;
  
  // Clear old localStorage keys
  localStorage.removeItem('lalumo_draw_melody_level');
  localStorage.removeItem('lalumo_draw_melody_success_counter');
  
  // Also persist the reset to localStorage using central progress object
  const progressData = localStorage.getItem('lalumo_progress');
  let progress = {};
  if (progressData) {
    try {
      progress = JSON.parse(progressData);
    } catch (error) {
      debugLog(['PITCHES', 'ERROR'], 'Error parsing progress data:', error);
    }
  }
  progress['1_3'] = 0;
  localStorage.setItem('lalumo_progress', JSON.stringify(progress));
  
  // Clear drawing canvas if present
  if (component.clearDrawing) {
    component.clearDrawing();
  }
  
  debugLog('PITCHES', 'RESET_DRAW_MELODY: Reset completed successfully');
}

/**
 * Snake Animation System for Draw Melody Activity
 */

// Snake image cache
const snakeImages = {
  headOpen: null,
  headClose: null,
  segment1: null,
  segment2: null,
  tail: null,
  loaded: false
};

// Animation state
let snakeAnimationFrame = 0;
let lastAnimationTime = 0;
// Persist head orientation for final pose
let lastHeadAngle = null;

/**
 * Preload snake images
 */
export function preloadSnakeImages() {
  const imagePaths = {
    headOpen: '/images/snake/green_open.png',
    headClose: '/images/snake/green_close.png',
    segment1: '/images/snake/green_segment1.png',
    segment2: '/images/snake/green_segment2.png',
    tail: '/images/snake/green_tail.png'
  };

  let loadedCount = 0;
  const totalImages = Object.keys(imagePaths).length;

  Object.entries(imagePaths).forEach(([key, path]) => {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        snakeImages.loaded = true;
        debugLog('SNAKE_ANIMATION', 'All snake images loaded successfully');
      }
    };
    img.onerror = () => {
      debugLog(['PITCHES', 'WARN'], `Failed to load snake image: ${path}`);
      loadedCount++;
      if (loadedCount === totalImages) {
        snakeImages.loaded = true;
      }
    };
    img.src = path;
    snakeImages[key] = img;
  });
}

/**
 * Calculate total path length
 * @param {Array} path - Array of {x, y} points
 * @returns {number} Total path length in pixels
 */
function calculatePathLength(path) {
  if (!path || path.length < 2) return 0;
  
  let totalLength = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i-1].x;
    const dy = path[i].y - path[i-1].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }
  return totalLength;
}

/**
 * Get position and direction along path at specific progress
 * @param {Array} path - Array of {x, y} points
 * @param {number} progress - Progress along path (0-1)
 * @returns {Object} {x, y, angle} position and direction
 */
function getPositionOnPath(path, progress) {
  if (!path || path.length < 2) return { x: 0, y: 0, angle: 0 };
  
  progress = Math.max(0, Math.min(1, progress));
  const totalLength = calculatePathLength(path);
  const targetDistance = totalLength * progress;
  
  let currentDistance = 0;
  
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i-1].x;
    const dy = path[i].y - path[i-1].y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);
    
    if (currentDistance + segmentLength >= targetDistance) {
      // Position is within this segment
      const segmentProgress = (targetDistance - currentDistance) / segmentLength;
      const x = path[i-1].x + dx * segmentProgress;
      const y = path[i-1].y + dy * segmentProgress;
      const angle = Math.atan2(dy, dx);
      
      return { x, y, angle };
    }
    
    currentDistance += segmentLength;
  }
  
  // Return last point if we've gone beyond the path
  const lastPoint = path[path.length - 1];
  const secondLastPoint = path[path.length - 2];
  const dx = lastPoint.x - secondLastPoint.x;
  const dy = lastPoint.y - secondLastPoint.y;
  const angle = Math.atan2(dy, dx);
  
  return { x: lastPoint.x, y: lastPoint.y, angle };
}

/**
 * Draw snake segment with rotation and stretching
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Image} image - Snake segment image
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} angle - Rotation angle in radians
 * @param {number} width - Segment width in pixels
 * @param {number} height - Segment height in pixels
 * @param {boolean} flipX - If true, horizontally mirror the sprite (after rotation)
 */
function drawSnakeSegment(ctx, image, x, y, angle, width = 30, height = 30, flipX = false) {
  if (!image || !image.complete) return;
  
  ctx.save();
  // Ensure snake is fully opaque (not affected by note marker transparency)
  ctx.globalAlpha = 1.0;
  ctx.translate(x, y);
  ctx.rotate(angle);
  if (flipX) {
    ctx.scale(1, -1);
  }

  // Clip to a rounded-rectangle to ensure round corners on every segment
  const w = width;
  const h = height;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const x1 = w / 2;
  const y1 = h / 2;
  const r = Math.min(h / 2, w / 2);

  ctx.beginPath();
  ctx.moveTo(x0 + r, y0);
  ctx.lineTo(x1 - r, y0);
  ctx.quadraticCurveTo(x1, y0, x1, y0 + r);
  ctx.lineTo(x1, y1 - r);
  ctx.quadraticCurveTo(x1, y1, x1 - r, y1);
  ctx.lineTo(x0 + r, y1);
  ctx.quadraticCurveTo(x0, y1, x0, y1 - r);
  ctx.lineTo(x0, y0 + r);
  ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(image, -width/2, -height/2, width, height);
  ctx.restore();
}

/**
 * Main snake animation function
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array} path - Path to follow (array of {x, y} points)
 * @param {number} progress - Animation progress (0-1)
 * @param {boolean} isPlaying - Whether melody is currently playing
 */
export function drawSnakeAnimation(canvas, path, progress, isPlaying = false, ssotIndices = null, ssotCurrentIndex = -1) {
  if (!canvas || !path || path.length < 2 || !snakeImages.loaded) {
    return;
  }
  
  const ctx = canvas.getContext('2d');
  const currentTime = Date.now();
  
  // Reset stored angle at start
  if (progress <= 0) {
    lastHeadAngle = null;
  }
  
  // Update animation frame for head alternation (every 200ms when playing)
  if (isPlaying && currentTime - lastAnimationTime > 200) {
    snakeAnimationFrame++;
    lastAnimationTime = currentTime;
  }
  
  // Calculate snake segments that fill the played path
  const totalPathLength = calculatePathLength(path);
  // If SSOT indices are provided, compute progress from cumulative length up to current SSOT point
  let effectiveProgress = progress;
  if (Array.isArray(ssotIndices) && ssotIndices.length >= 2 && ssotCurrentIndex >= 0) {
    const idx = Math.min(ssotCurrentIndex, ssotIndices.length - 1);
    const targetOriginalIndex = ssotIndices[idx];
    let acc = 0;
    for (let i = 1; i <= targetOriginalIndex && i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      acc += Math.hypot(dx, dy);
    }
    effectiveProgress = totalPathLength > 0 ? Math.max(0, Math.min(1, acc / totalPathLength)) : progress;
  }
  const playedLength = totalPathLength * effectiveProgress;
  const segmentSize = 25; // Base segment size in pixels
  const numSegments = Math.max(1, Math.floor(playedLength / segmentSize) + 1);
  
  // Generate segment positions that stretch to fill the path
  const segments = [];
  
  for (let i = 0; i < numSegments; i++) {
    // Distribute segments evenly along the played portion
    const segmentProgress = effectiveProgress * (i / (numSegments - 1 || 1));
    const position = getPositionOnPath(path, segmentProgress);
    
    // Calculate stretch factor based on path density - increased for overlap
    const stretchFactor = Math.min(3, Math.max(1.2, playedLength / (numSegments * segmentSize * 0.7)));
    
    segments.push({
      ...position,
      isHead: i === numSegments - 1, // Head is at the front (highest progress)
      isTail: i === 0 && numSegments > 3, // Tail is at the back
      segmentIndex: i,
      width: segmentSize * stretchFactor,
      height: segmentSize,
      progress: segmentProgress
    });
  }
  
  // Draw segments from tail to head
  segments.forEach((segment, index) => {
    let image;
    
    if (segment.isHead) {
      // Alternating head animation
      image = (snakeAnimationFrame % 2 === 0) ? snakeImages.headOpen : snakeImages.headClose;
    } else if (segment.isTail) {
      image = snakeImages.tail;
    } else if (segment.segmentIndex === 1) {
      // First body segment is always segment2
      image = snakeImages.segment2;
    } else {
      // Random mix of segment1 and segment2 for other body parts
      const randomSeed = segment.segmentIndex + Math.floor(currentTime / 1000);
      image = (randomSeed % 2 === 0) ? snakeImages.segment1 : snakeImages.segment2;
    }

    // Rotation and optional mirroring for head/tail
    if (segment.isHead || segment.isTail) {
      // Base angle (tangent) used for consistent final pose and mirroring
      const baseAngle = segment.angle;
      if (segment.isHead && effectiveProgress < 0.999) {
        // Update stored head angle during movement
        lastHeadAngle = baseAngle;
      }

      // Determine final pose
      const HEAD_OVERSHOOT_PX = 10; // small overshoot so the note sits at the neck
      let drawX = segment.x;
      let drawY = segment.y;
      let useAngle = baseAngle;
      if (segment.isHead && effectiveProgress >= 0.999) {
        // Keep the last movement inclination and overshoot slightly forward
        useAngle = lastHeadAngle != null ? lastHeadAngle : baseAngle;
        drawX = segment.x + Math.cos(useAngle) * HEAD_OVERSHOOT_PX;
        drawY = segment.y + Math.sin(useAngle) * HEAD_OVERSHOOT_PX;
      }

      let rotation = useAngle + Math.PI; // assets face left; rotate 180°
      const movingRight = Math.cos(useAngle) > 0;
      const flipX = segment.isHead && movingRight;
      drawSnakeSegment(ctx, image, drawX, drawY, rotation, segment.width, segment.height, flipX);
      return; // done with head/tail
    }

    // Curved body approximation (Option A): split into k micro-segments sampled along path
    const CURVED_K = 3; // as per rollout plan
    const EPS_PX = 12; // local window in pixels for curvature sampling
    const epsProgress = totalPathLength > 0 ? (EPS_PX / totalPathLength) : 0.0;
    const startT = Math.max(0, segment.progress - epsProgress);
    const endT = Math.min(effectiveProgress, segment.progress + epsProgress);
    const denom = CURVED_K - 1 || 1;

    // Slight width overlap to avoid gaps between micro-segments
    const microWidth = (segment.width / CURVED_K) * 1.3;

    for (let j = 0; j < CURVED_K; j++) {
      const t = startT + ((endT - startT) * (j / denom));
      const pos = getPositionOnPath(path, t);
      const rotation = pos.angle; // body faces along tangent without the 180° correction
      drawSnakeSegment(ctx, image, pos.x, pos.y, rotation, microWidth, segment.height, false);
    }
  });
  
  debugLog('SNAKE_ANIMATION', `Drew snake with ${segments.length} segments at progress ${progress.toFixed(2)}`);
}

/**
 * Clear snake animation
 * @param {HTMLCanvasElement} canvas - Canvas element
 */
export function clearSnakeAnimation(canvas) {
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Initialize snake animation system
 */
export function initSnakeAnimation() {
  preloadSnakeImages();
  debugLog('SNAKE_ANIMATION', 'Snake animation system initialized');
}

// Make globally available for diagnosis
window.get_1_3_level = get_1_3_level;
window.reset_1_3_DrawMelody_Progress = reset_1_3_DrawMelody_Progress;
window.drawSnakeAnimation = drawSnakeAnimation;
window.initSnakeAnimation = initSnakeAnimation;
