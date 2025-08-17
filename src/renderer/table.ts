/**
 * HTML Table Renderer for RCSV
 */

import type { Sheet, CellValue } from '../core/engine/types';
import { DataType } from '../core/engine/types';

/**
 * Render a sheet as an HTML table
 * @param sheet - Sheet to render
 * @returns HTML table element
 */
export function renderTable(sheet: Sheet): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'rcsv-table';
  
  // Create header row from column metadata
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  sheet.metadata.columns.forEach(column => {
    const th = document.createElement('th');
    th.textContent = column.name;
    th.className = `rcsv-header rcsv-type-${column.type || 'text'}`;
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create data rows
  const tbody = document.createElement('tbody');
  
  sheet.data.forEach((row) => {
    const tr = document.createElement('tr');
    
    row.forEach((cell, colIndex) => {
      const td = document.createElement('td');
      const column = sheet.metadata.columns[colIndex];
      
      // Apply cell formatting (handle UNSPECIFIED case)
      const cellType = column?.type === 'UNSPECIFIED' ? cell.type : (column?.type || cell.type);
      td.className = `rcsv-cell rcsv-type-${cellType}`;
      
      // Format and display the value
      const displayValue = formatCellValue(cell, cellType);
      td.textContent = displayValue;
      
      // Add title attribute to show formula if present
      if (cell.formula) {
        td.title = cell.formula;
        td.classList.add('rcsv-has-formula');
      }
      
      // Add error class if there's an error
      if (cell.error) {
        td.classList.add('rcsv-error');
        td.title = cell.error;
      }
      
      // Add alignment based on type
      if (column?.type === DataType.NUMBER || 
          column?.type === DataType.CURRENCY || 
          column?.type === DataType.PERCENTAGE) {
        td.classList.add('rcsv-align-right');
      } else if (column?.type === DataType.BOOLEAN) {
        td.classList.add('rcsv-align-center');
      }
      
      tr.appendChild(td);
    });
    
    tbody.appendChild(tr);
  });
  
  table.appendChild(tbody);
  
  return table;
}

/**
 * Format a cell value for display
 */
function formatCellValue(cell: CellValue, type: DataType): string {
  // Handle errors
  if (cell.error) {
    return cell.value?.toString() || '#ERROR!';
  }
  
  // Handle null/undefined
  if (cell.value === null || cell.value === undefined || cell.value === '') {
    return '';
  }
  
  // Format based on type
  switch (type) {
    case DataType.CURRENCY:
      return formatCurrency(cell.value);
      
    case DataType.PERCENTAGE:
      return formatPercentage(cell.value);
      
    case DataType.NUMBER:
      return formatNumber(cell.value);
      
    case DataType.BOOLEAN:
      return formatBoolean(cell.value);
      
    case DataType.DATE:
      return formatDate(cell.value);
      
    default:
      return String(cell.value);
  }
}

/**
 * Format a number as currency
 */
function formatCurrency(value: any): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

/**
 * Format a number as percentage
 */
function formatPercentage(value: any): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num);
}

/**
 * Format a number
 */
function formatNumber(value: any): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  
  // Use appropriate decimal places
  const decimals = num % 1 === 0 ? 0 : 2;
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

/**
 * Format a boolean value
 */
function formatBoolean(value: any): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}

/**
 * Format a date value
 */
function formatDate(value: any): string {
  if (value instanceof Date) {
    return value.toLocaleDateString('en-US');
  }
  return String(value);
}