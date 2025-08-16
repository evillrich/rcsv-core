/**
 * RCSV Demo Application
 * Demonstrates the integration of core parser and web renderer
 */

import { parseRCSV, toJSON } from '../core';
import { renderRCSV } from '../renderer';

// Get DOM elements
const inputTextarea = document.getElementById('rcsv-input') as HTMLTextAreaElement;
const parseButton = document.getElementById('parse-btn') as HTMLButtonElement;
const outputContainer = document.getElementById('output-container') as HTMLDivElement;
const jsonOutput = document.getElementById('json-output') as HTMLPreElement;

// Handle parse button click
parseButton.addEventListener('click', () => {
  try {
    // Get input text
    const input = inputTextarea.value;
    
    // Parse RCSV
    console.log('Parsing RCSV...');
    const doc = parseRCSV(input);
    
    // Render to HTML
    console.log('Rendering to HTML...');
    renderRCSV(doc, outputContainer);
    
    // Show JSON structure
    console.log('Converting to JSON...');
    const json = toJSON(doc);
    jsonOutput.textContent = JSON.stringify(json, null, 2);
    
    console.log('Success!', doc);
  } catch (error) {
    console.error('Error:', error);
    outputContainer.innerHTML = `<div class="error">Error: ${(error as Error).message}</div>`;
    jsonOutput.textContent = '';
  }
});

// Parse on load
window.addEventListener('DOMContentLoaded', () => {
  parseButton.click();
});