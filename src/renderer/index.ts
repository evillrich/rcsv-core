/**
 * RCSV Web Renderer
 * HTML table and chart rendering for RCSV documents with layout positioning
 */

import type { RCSVDocument } from '../core/engine/types';
import { renderTable } from './table';
import { renderChart } from './charts';

export { renderTable } from './table';
export { renderChart } from './charts';

/**
 * Represents a rendered content block (chart or table) with positioning
 */
interface RenderedBlock {
  type: 'chart' | 'table';
  element: HTMLElement;
  position: 'bottom' | 'right'; // Default is always 'bottom'
  sourceOrder: number;
}

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
    
    // Create all content blocks in source order
    const blocks: RenderedBlock[] = [];
    
    // Process contentBlocks in their source order
    if (sheet.metadata.contentBlocks && sheet.metadata.contentBlocks.length > 0) {
      // Sort by source order to ensure proper sequence
      const sortedBlocks = [...sheet.metadata.contentBlocks].sort((a, b) => a.sourceOrder - b.sourceOrder);
      
      sortedBlocks.forEach(contentBlock => {
        if (contentBlock.type === 'chart' && contentBlock.chart) {
          try {
            const canvas = renderChart(contentBlock.chart, sheet);
            const chartWrapper = document.createElement('div');
            chartWrapper.className = 'rcsv-chart-wrapper';
            chartWrapper.appendChild(canvas);
            
            blocks.push({
              type: 'chart',
              element: chartWrapper,
              position: contentBlock.chart.position || 'bottom',
              sourceOrder: contentBlock.sourceOrder
            });
          } catch (error) {
            console.error('Error rendering chart:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'rcsv-chart-error';
            errorDiv.textContent = `Chart rendering error: ${(error as Error).message}`;
            
            blocks.push({
              type: 'chart',
              element: errorDiv,
              position: contentBlock.chart.position || 'bottom',
              sourceOrder: contentBlock.sourceOrder
            });
          }
        } else if (contentBlock.type === 'table' && contentBlock.table) {
          try {
            const table = renderTable(sheet);
            const tableWrapper = document.createElement('div');
            tableWrapper.className = 'rcsv-table-wrapper';
            tableWrapper.appendChild(table);
            
            blocks.push({
              type: 'table',
              element: tableWrapper,
              position: contentBlock.table.position || 'bottom',
              sourceOrder: contentBlock.sourceOrder
            });
          } catch (error) {
            console.error('Error rendering table:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'rcsv-table-error';
            errorDiv.textContent = `Table rendering error: ${(error as Error).message}`;
            
            blocks.push({
              type: 'table',
              element: errorDiv,
              position: contentBlock.table.position || 'bottom',
              sourceOrder: contentBlock.sourceOrder
            });
          }
        }
      });
    }
    
    // If no contentBlocks or no table declarations, add the default table at the end
    if (!sheet.metadata.contentBlocks || 
        !sheet.metadata.contentBlocks.some(block => block.type === 'table')) {
      try {
        const table = renderTable(sheet);
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'rcsv-table-wrapper';
        tableWrapper.appendChild(table);
        
        blocks.push({
          type: 'table',
          element: tableWrapper,
          position: 'bottom', // Always bottom for default table
          sourceOrder: 9999 // Ensure it comes last
        });
      } catch (error) {
        console.error('Error rendering table:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'rcsv-table-error';
        errorDiv.textContent = `Table rendering error: ${(error as Error).message}`;
        
        blocks.push({
          type: 'table',
          element: errorDiv,
          position: 'bottom',
          sourceOrder: 9999
        });
      }
    }
    
    // Layout blocks according to positioning
    layoutBlocks(blocks, sheetDiv);
    
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

/**
 * Layout content blocks according to their position metadata
 * @param blocks - Array of rendered blocks in source order
 * @param container - Container element to append layout to
 */
function layoutBlocks(blocks: RenderedBlock[], container: HTMLElement): void {
  if (blocks.length === 0) return;
  
  let currentRow: HTMLElement | null = null;
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    // Add CSS classes for positioning
    block.element.classList.add(`rcsv-position-${block.position}`);
    
    if (block.position === 'right' && currentRow) {
      // Add to the current horizontal row
      currentRow.appendChild(block.element);
    } else {
      // Create a new row (position is 'bottom' or this is the first block)
      const rowDiv = document.createElement('div');
      rowDiv.className = 'rcsv-layout-row';
      rowDiv.appendChild(block.element);
      
      container.appendChild(rowDiv);
      currentRow = rowDiv;
    }
  }
}