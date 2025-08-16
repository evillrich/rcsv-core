/**
 * HTML Table Renderer for RCSV
 */

import type { Sheet } from '../core/engine/types';

/**
 * Render a sheet as an HTML table
 * @param sheet - Sheet to render
 * @returns HTML table element
 */
export function renderTable(sheet: Sheet): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'rcsv-table';
  
  // TODO: Implement table rendering
  // 1. Create header row from column metadata
  // 2. Create data rows
  // 3. Apply formatting
  // 4. Handle cell values vs formulas
  
  return table;
}