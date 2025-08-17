/**
 * RCSV Web Renderer
 * HTML table and chart rendering for RCSV documents
 */

import type { RCSVDocument } from '../core/engine/types';
import { renderTable } from './table';
import { renderChart } from './charts';

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
    title.className = 'rcsv-title';
    container.appendChild(title);
  }
  
  if (doc.metadata.author) {
    const author = document.createElement('p');
    author.textContent = `By: ${doc.metadata.author}`;
    author.className = 'rcsv-author';
    container.appendChild(author);
  }
  
  // Render each sheet
  doc.sheets.forEach(sheet => {
    const sheetDiv = document.createElement('div');
    sheetDiv.className = 'rcsv-sheet';
    
    // Add sheet name if not default
    if (sheet.name !== 'Sheet1') {
      const sheetTitle = document.createElement('h2');
      sheetTitle.textContent = sheet.name;
      sheetTitle.className = 'rcsv-sheet-title';
      sheetDiv.appendChild(sheetTitle);
    }
    
    // Render charts first (they're typically summary visuals)
    if (sheet.charts && sheet.charts.length > 0) {
      const chartsContainer = document.createElement('div');
      chartsContainer.className = 'rcsv-charts';
      
      sheet.charts.forEach(chart => {
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'rcsv-chart-wrapper';
        
        try {
          const canvas = renderChart(chart, sheet);
          chartWrapper.appendChild(canvas);
          chartsContainer.appendChild(chartWrapper);
        } catch (error) {
          console.error('Error rendering chart:', error);
          const errorDiv = document.createElement('div');
          errorDiv.className = 'rcsv-chart-error';
          errorDiv.textContent = `Chart rendering error: ${(error as Error).message}`;
          chartWrapper.appendChild(errorDiv);
          chartsContainer.appendChild(chartWrapper);
        }
      });
      
      sheetDiv.appendChild(chartsContainer);
    }
    
    // Render table
    try {
      const table = renderTable(sheet);
      const tableWrapper = document.createElement('div');
      tableWrapper.className = 'rcsv-table-wrapper';
      tableWrapper.appendChild(table);
      sheetDiv.appendChild(tableWrapper);
    } catch (error) {
      console.error('Error rendering table:', error);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'rcsv-table-error';
      errorDiv.textContent = `Table rendering error: ${(error as Error).message}`;
      sheetDiv.appendChild(errorDiv);
    }
    
    container.appendChild(sheetDiv);
  });
  
  // Add memory stats if available
  if (doc.memoryStats) {
    const statsDiv = document.createElement('div');
    statsDiv.className = 'rcsv-stats';
    statsDiv.innerHTML = `
      <small>
        Rows: ${doc.memoryStats.estimatedRows} | 
        Memory: ~${doc.memoryStats.estimatedMemoryMB.toFixed(2)} MB
      </small>
    `;
    container.appendChild(statsDiv);
  }
}