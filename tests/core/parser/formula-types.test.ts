/**
 * Tests for formula cell type assignment
 */

import { describe, it, expect } from 'vitest';
import { parseStructure } from '../../../src/core/parser';
import { calculate } from '../../../src/core/engine/calculator';
import { DataType } from '../../../src/core/engine/types';

describe('Formula Type Assignment', () => {
  it('should preserve column types for formula cells', () => {
    const input = `## Chart: type=bar, title="Test", x=Month, y=Amount
Month:text,Amount:currency,Growth:percentage
January,1000,
February,=B1*1.1,=(B2-B1)/B1
Total,=SUM(B1:B2),=AVERAGE(C2:C2)`;

    const doc = parseStructure(input);
    const calculated = calculate(doc);
    const sheet = calculated.sheets[0];

    // Check column metadata
    expect(sheet.metadata.columns).toEqual([
      { name: 'Month', type: DataType.TEXT },
      { name: 'Amount', type: DataType.CURRENCY },
      { name: 'Growth', type: DataType.PERCENTAGE }
    ]);

    // Row 0: January,1000,
    expect(sheet.data[0][0].type).toBe(DataType.TEXT);
    expect(sheet.data[0][1].type).toBe(DataType.CURRENCY);
    expect(sheet.data[0][2].type).toBe(DataType.PERCENTAGE);

    // Row 1: February,=B1*1.1,=(B2-B1)/B1
    expect(sheet.data[1][0].type).toBe(DataType.TEXT);
    expect(sheet.data[1][1].type).toBe(DataType.CURRENCY); // Formula cell should inherit column type
    expect(sheet.data[1][1].formula).toBe('=B1*1.1');
    expect(sheet.data[1][2].type).toBe(DataType.PERCENTAGE); // Formula cell should inherit column type
    expect(sheet.data[1][2].formula).toBe('=(B2-B1)/B1');

    // Row 2: Total,=SUM(B1:B2),=AVERAGE(C2:C2)
    expect(sheet.data[2][0].type).toBe(DataType.TEXT);
    expect(sheet.data[2][1].type).toBe(DataType.CURRENCY); // Formula cell should inherit column type
    expect(sheet.data[2][1].formula).toBe('=SUM(B1:B2)');
    expect(sheet.data[2][2].type).toBe(DataType.PERCENTAGE); // Formula cell should inherit column type
    expect(sheet.data[2][2].formula).toBe('=AVERAGE(C2:C2)');
  });

  it('should apply inferred types to formula cells when no explicit type annotation', () => {
    const input = `Month,Revenue,Profit
January,1000,=B1*0.2
February,=B1*1.1,=B2*0.2`;

    const doc = parseStructure(input);
    const calculated = calculate(doc);
    const sheet = calculated.sheets[0];

    // Check that types were inferred and applied to formula cells
    expect(sheet.data[0][1].type).toBe(DataType.NUMBER); // Revenue column should be inferred as number
    expect(sheet.data[0][2].type).toBe(DataType.NUMBER); // Profit column should be inferred as number
    
    expect(sheet.data[1][1].type).toBe(DataType.NUMBER); // Formula cell inherits inferred type
    expect(sheet.data[1][1].formula).toBe('=B1*1.1');
    expect(sheet.data[1][2].type).toBe(DataType.NUMBER); // Formula cell inherits inferred type
    expect(sheet.data[1][2].formula).toBe('=B2*0.2');
  });

  it('should handle mixed formula and non-formula cells in same column', () => {
    const input = `Item:text,Price:currency,Tax:currency
Laptop,1000,=B1*0.08
Mouse,25,2.00
Total,=SUM(B1:B2),=SUM(C1:C2)`;

    const doc = parseStructure(input);
    const calculated = calculate(doc);
    const sheet = calculated.sheets[0];

    // All cells in Price column should be currency type
    expect(sheet.data[0][1].type).toBe(DataType.CURRENCY); // 1000
    expect(sheet.data[1][1].type).toBe(DataType.CURRENCY); // 25
    expect(sheet.data[2][1].type).toBe(DataType.CURRENCY); // =SUM(B1:B2)
    expect(sheet.data[2][1].formula).toBe('=SUM(B1:B2)');

    // All cells in Tax column should be currency type
    expect(sheet.data[0][2].type).toBe(DataType.CURRENCY); // =B1*0.08
    expect(sheet.data[0][2].formula).toBe('=B1*0.08');
    expect(sheet.data[1][2].type).toBe(DataType.CURRENCY); // 2.00
    expect(sheet.data[2][2].type).toBe(DataType.CURRENCY); // =SUM(C1:C2)
    expect(sheet.data[2][2].formula).toBe('=SUM(C1:C2)');
  });

  it('should preserve types in cross-sheet references', () => {
    const input = `# Sheet: Revenue
Month:text,Amount:currency
January,1000
February,1200

# Sheet: Summary
Month:text,Revenue:currency,Tax:currency
January,=Revenue!B1,=B1*0.08
February,=Revenue!B2,=B2*0.08`;

    const doc = parseStructure(input);
    const calculated = calculate(doc);
    const summarySheet = calculated.sheets.find(s => s.name === 'Summary');

    expect(summarySheet).toBeDefined();
    if (summarySheet) {
      // Cross-sheet formula cells should inherit column types
      expect(summarySheet.data[0][1].type).toBe(DataType.CURRENCY); // =Revenue!B1
      expect(summarySheet.data[0][1].formula).toBe('=Revenue!B1');
      expect(summarySheet.data[0][2].type).toBe(DataType.CURRENCY); // =B1*0.08
      expect(summarySheet.data[0][2].formula).toBe('=B1*0.08');
      
      expect(summarySheet.data[1][1].type).toBe(DataType.CURRENCY); // =Revenue!B2
      expect(summarySheet.data[1][1].formula).toBe('=Revenue!B2');
      expect(summarySheet.data[1][2].type).toBe(DataType.CURRENCY); // =B2*0.08
      expect(summarySheet.data[1][2].formula).toBe('=B2*0.08');
    }
  });
});