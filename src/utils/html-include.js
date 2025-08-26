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

import { debugLog } from './debug';

/**
 * HTML Include Utility
 * Processes elements with data-include attributes to load content from HTML partials
 */

// Load HTML partials into DOM elements with data-include attribute
export function loadHtmlPartials() {
  const includes = document.querySelectorAll('[data-include]');
  
  // Process each include element
  includes.forEach(element => {
    let file = element.getAttribute('data-include');
    
    // Handle paths based on file structure reorganization
    if (!file.startsWith('/')) {
      // Check if this is a partial reference
      if (file.includes('partial') || file.includes('partials')) {
        // If it doesn't already include 'partials/' prefix, add it
        if (!file.startsWith('partials/')) {
          file = 'partials/' + file.replace(/^(\.\/)?(partials\/)?/g, '');
        }
      }
    }
    
    // Support for base path and app subfolder in both production and development
    let basePath = document.querySelector('base')?.getAttribute('href') || '';
    
    // Detect if we're in the app subfolder and adjust path accordingly
    const inAppSubfolder = window.location.pathname.includes('/app/');
    if (inAppSubfolder && !basePath && file.startsWith('partials/')) {
      debugLog('HTML_INCLUDE', 'Detected app subfolder, adjusting partial path');
      basePath = '../';
    }
    const fullPath = basePath + file;
    
    debugLog('HTML_INCLUDE', `Attempting to load HTML partial: ${fullPath}`);
    
    // Make an AJAX request to fetch the partial
    fetch(fullPath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error loading HTML partial: ${file}`);
        }
        return response.text();
      })
      .then(html => {
        // Insert the HTML content
        element.innerHTML = html;
        
        // Alpine.js needs to be notified if we're injecting components after initial load
        if (window.Alpine) {
          window.Alpine.initTree(element);
        }
      })
      .catch(error => {
        debugLog(['HTML_INCLUDE', 'ERROR'], `HTML partial loading error: ${error.message || error}`);
        element.innerHTML = `<div class="error-message">Error loading content</div>`;
      });
  });
}
