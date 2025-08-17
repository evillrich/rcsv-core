/**
 * RCSV Demo Application
 * Demonstrates the integration of core parser and web renderer
 */

import { parseStructure } from '../core/parser';
import { calculate } from '../core/engine/calculator';
import { renderRCSV } from '../renderer';
import type { RCSVDocument } from '../core/engine/types';

// Get DOM elements
const inputTextarea = document.getElementById('rcsv-input') as HTMLTextAreaElement;
const parseButton = document.getElementById('parse-btn') as HTMLButtonElement;
const outputContainer = document.getElementById('output-container') as HTMLDivElement;
const jsonOutput = document.getElementById('json-output') as HTMLPreElement;

/**
 * Parse RCSV text and calculate all formulas
 */
function parseRCSV(text: string): RCSVDocument {
  const doc = parseStructure(text);
  return calculate(doc);
}

/**
 * Convert RCSV document to JSON
 */
function toJSON(doc: RCSVDocument): object {
  return {
    metadata: doc.metadata,
    sheets: doc.sheets.map(sheet => ({
      name: sheet.name,
      metadata: sheet.metadata,
      charts: sheet.charts,
      data: sheet.data.map(row => 
        row.map(cell => ({
          value: cell.value,
          formula: cell.formula,
          error: cell.error,
          type: cell.type
        }))
      )
    })),
    memoryStats: doc.memoryStats
  };
}

// Handle parse button click
parseButton?.addEventListener('click', () => {
  try {
    // Get input text
    const input = inputTextarea.value;
    
    // Parse RCSV
    console.log('Parsing RCSV...');
    const doc = parseRCSV(input);
    console.log('Parsed document:', doc);
    
    // Render to HTML
    console.log('Rendering to HTML...');
    renderRCSV(doc, outputContainer);
    
    // Show JSON structure
    console.log('Converting to JSON...');
    const json = toJSON(doc);
    jsonOutput.textContent = JSON.stringify(json, null, 2);
    
    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
    outputContainer.innerHTML = `<div class="error">Error: ${(error as Error).message}</div>`;
    jsonOutput.textContent = '';
  }
});

// Parse on load
window.addEventListener('DOMContentLoaded', () => {
  if (parseButton) {
    parseButton.click();
  }
});