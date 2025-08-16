/**
 * RCSV Web Renderer
 * HTML table and chart rendering for RCSV documents
 */

import type { RCSVDocument } from '../core/engine/types';

export { renderTable } from './table';
export { renderChart } from './charts';

/**
 * Render an entire RCSV document to HTML
 * @param doc - Parsed RCSV document
 * @param container - HTML container element
 */
export function renderRCSV(doc: RCSVDocument, container: HTMLElement): void {
  container.innerHTML = '';
  
  // Add document metadata if present
  if (doc.metadata.title) {
    const title = document.createElement('h1');
    title.textContent = doc.metadata.title;
    container.appendChild(title);
  }
  
  // Render each sheet
  doc.sheets.forEach(sheet => {
    const sheetDiv = document.createElement('div');
    sheetDiv.className = 'rcsv-sheet';
    
    if (sheet.name !== 'Sheet1') {
      const sheetTitle = document.createElement('h2');
      sheetTitle.textContent = sheet.name;
      sheetDiv.appendChild(sheetTitle);
    }
    
    // TODO: Render table
    // TODO: Render charts
    
    container.appendChild(sheetDiv);
  });
}