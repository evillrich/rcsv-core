/**
 * Tests for HTML Table Renderer
 */

import { describe, it, expect } from 'vitest';
import { renderTable } from '../../src/renderer/table';
import type { Sheet, CellValue } from '../../src/core/engine/types';
import { DataType } from '../../src/core/engine/types';

/**
 * Helper to create a mock sheet
 */
function createMockSheet(data: CellValue[][], columnTypes: DataType[]): Sheet {
  return {
    name: 'TestSheet',
    metadata: {
      columns: columnTypes.map((type, i) => ({
        name: `Column${i + 1}`,
        type
      }))
    },
    charts: [],
    data
  };
}

/**
 * Helper to create a cell value
 */
function createCell(value: any, type: DataType = DataType.TEXT, formula?: string, error?: string): CellValue {
  return { value, type, formula, error };
}

describe('renderTable', () => {
  it('should render a basic table with headers', () => {
    const sheet = createMockSheet(
      [
        [createCell('A1'), createCell('B1')],
        [createCell('A2'), createCell('B2')]
      ],
      [DataType.TEXT, DataType.TEXT]
    );

    const table = renderTable(sheet);

    expect(table.tagName).toBe('TABLE');
    expect(table.className).toBe('rcsv-table');
    
    // Check headers
    const headers = table.querySelectorAll('th');
    expect(headers).toHaveLength(2);
    expect(headers[0].textContent).toBe('Column1');
    expect(headers[1].textContent).toBe('Column2');
    
    // Check data rows
    const dataRows = table.querySelectorAll('tbody tr');
    expect(dataRows).toHaveLength(2);
    
    const firstRowCells = dataRows[0].querySelectorAll('td');
    expect(firstRowCells[0].textContent).toBe('A1');
    expect(firstRowCells[1].textContent).toBe('B1');
  });

  it('should format currency values correctly', () => {
    const sheet = createMockSheet(
      [
        [createCell(1234.56, DataType.CURRENCY)]
      ],
      [DataType.CURRENCY]
    );

    const table = renderTable(sheet);
    const cell = table.querySelector('tbody td');
    
    expect(cell?.textContent).toBe('$1,234.56');
    expect(cell?.className).toContain('rcsv-type-currency');
    expect(cell?.className).toContain('rcsv-align-right');
  });

  it('should format percentage values correctly', () => {
    const sheet = createMockSheet(
      [
        [createCell(0.1234, DataType.PERCENTAGE)]
      ],
      [DataType.PERCENTAGE]
    );

    const table = renderTable(sheet);
    const cell = table.querySelector('tbody td');
    
    expect(cell?.textContent).toBe('12.34%');
    expect(cell?.className).toContain('rcsv-type-percentage');
  });

  it('should format number values correctly', () => {
    const sheet = createMockSheet(
      [
        [createCell(1234.5, DataType.NUMBER)],
        [createCell(1234, DataType.NUMBER)]
      ],
      [DataType.NUMBER]
    );

    const table = renderTable(sheet);
    const cells = table.querySelectorAll('tbody td');
    
    expect(cells[0].textContent).toBe('1,234.50');
    expect(cells[1].textContent).toBe('1,234');
    expect(cells[0].className).toContain('rcsv-type-number');
    expect(cells[0].className).toContain('rcsv-align-right');
  });

  it('should format boolean values correctly', () => {
    const sheet = createMockSheet(
      [
        [createCell(true, DataType.BOOLEAN)],
        [createCell(false, DataType.BOOLEAN)]
      ],
      [DataType.BOOLEAN]
    );

    const table = renderTable(sheet);
    const cells = table.querySelectorAll('tbody td');
    
    expect(cells[0].textContent).toBe('Yes');
    expect(cells[1].textContent).toBe('No');
    expect(cells[0].className).toContain('rcsv-type-boolean');
    expect(cells[0].className).toContain('rcsv-align-center');
  });

  it('should format date values correctly', () => {
    const date = new Date('2023-12-25T00:00:00.000Z');
    const sheet = createMockSheet(
      [
        [createCell(date, DataType.DATE)]
      ],
      [DataType.DATE]
    );

    const table = renderTable(sheet);
    const cell = table.querySelector('tbody td');
    
    // Use the actual formatted date to avoid timezone issues
    const expectedDate = date.toLocaleDateString('en-US');
    expect(cell?.textContent).toBe(expectedDate);
    expect(cell?.className).toContain('rcsv-type-date');
  });

  it('should show formula indicators for cells with formulas', () => {
    const sheet = createMockSheet(
      [
        [createCell(100, DataType.NUMBER, '=A1+B1')]
      ],
      [DataType.NUMBER]
    );

    const table = renderTable(sheet);
    const cell = table.querySelector('tbody td');
    
    expect(cell?.className).toContain('rcsv-has-formula');
    expect(cell?.title).toBe('=A1+B1');
  });

  it('should show error styling for cells with errors', () => {
    const sheet = createMockSheet(
      [
        [createCell('#ERROR!', DataType.TEXT, '=1/0', 'Division by zero')]
      ],
      [DataType.TEXT]
    );

    const table = renderTable(sheet);
    const cell = table.querySelector('tbody td');
    
    expect(cell?.className).toContain('rcsv-error');
    expect(cell?.title).toBe('Division by zero');
    expect(cell?.textContent).toBe('#ERROR!');
  });

  it('should handle empty and null values', () => {
    const sheet = createMockSheet(
      [
        [createCell(null, DataType.TEXT)],
        [createCell(undefined, DataType.TEXT)],
        [createCell('', DataType.TEXT)]
      ],
      [DataType.TEXT]
    );

    const table = renderTable(sheet);
    const cells = table.querySelectorAll('tbody td');
    
    expect(cells[0].textContent).toBe('');
    expect(cells[1].textContent).toBe('');
    expect(cells[2].textContent).toBe('');
  });

  it('should handle invalid numeric values gracefully', () => {
    const sheet = createMockSheet(
      [
        [createCell('not a number', DataType.CURRENCY)],
        [createCell('not a number', DataType.PERCENTAGE)],
        [createCell('not a number', DataType.NUMBER)]
      ],
      [DataType.CURRENCY]
    );

    const table = renderTable(sheet);
    const cells = table.querySelectorAll('tbody td');
    
    // Should fall back to string representation
    expect(cells[0].textContent).toBe('not a number');
    expect(cells[1].textContent).toBe('not a number');
    expect(cells[2].textContent).toBe('not a number');
  });

  it('should apply correct CSS classes based on data types', () => {
    const sheet = createMockSheet(
      [
        [
          createCell('text', DataType.TEXT),
          createCell(123, DataType.NUMBER),
          createCell(true, DataType.BOOLEAN),
          createCell(123.45, DataType.CURRENCY)
        ]
      ],
      [DataType.TEXT, DataType.NUMBER, DataType.BOOLEAN, DataType.CURRENCY]
    );

    const table = renderTable(sheet);
    const cells = table.querySelectorAll('tbody td');
    
    expect(cells[0].className).toContain('rcsv-type-text');
    expect(cells[1].className).toContain('rcsv-type-number');
    expect(cells[1].className).toContain('rcsv-align-right');
    expect(cells[2].className).toContain('rcsv-type-boolean');
    expect(cells[2].className).toContain('rcsv-align-center');
    expect(cells[3].className).toContain('rcsv-type-currency');
    expect(cells[3].className).toContain('rcsv-align-right');
  });
});