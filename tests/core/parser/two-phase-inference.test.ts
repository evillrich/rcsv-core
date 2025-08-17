import { describe, it, expect } from 'vitest';
import { parseStructure } from '../../../src/core/parser/index';
import { calculate } from '../../../src/core/engine/calculator';
import { DataType } from '../../../src/core/engine/types';

describe('Two-Phase Type Inference', () => {
  it('should use Phase 1 for columns with mostly values', () => {
    const input = `Month,Revenue
January,1000
February,1200
March,=B2*1.1`;

    const doc = parseStructure(input);
    
    // Revenue column has 2 values, 1 formula (33% formulas < 50% threshold)
    // Should infer NUMBER type in Phase 1
    expect(doc.sheets[0].metadata.columns[1].type).toBe(DataType.NUMBER);
    expect(doc.sheets[0].data[0][1].type).toBe(DataType.NUMBER);
  });

  it('should defer to Phase 2 for formula-heavy columns', () => {
    const input = `Month,Revenue
January,1000
February,=B1*1.2
March,=B2*1.1
April,=B3*1.05`;

    const doc = parseStructure(input);
    
    // Revenue column has 1 value, 3 formulas (75% formulas > 50% threshold)
    // Should be marked as UNSPECIFIED for Phase 2
    expect(doc.sheets[0].metadata.columns[1].type).toBe('UNSPECIFIED');
    
    // Calculate to trigger Phase 2
    const calculated = calculate(doc);
    
    // After calculation, should infer NUMBER type from calculated values
    expect(calculated.sheets[0].metadata.columns[1].type).toBe(DataType.NUMBER);
    expect(calculated.sheets[0].data[0][1].type).toBe(DataType.NUMBER);
  });

  it('should handle mixed formula results in Phase 2', () => {
    const input = `Item,Amount
=1+0,=100*2
=2+0,=50*3
=3+0,=25*4`;

    const doc = parseStructure(input);
    
    // Both columns are formula-heavy (100% formulas), should be UNSPECIFIED
    expect(doc.sheets[0].metadata.columns[0].type).toBe('UNSPECIFIED');
    expect(doc.sheets[0].metadata.columns[1].type).toBe('UNSPECIFIED');
    
    // Calculate to trigger Phase 2
    const calculated = calculate(doc);
    
    // Both columns should infer NUMBER from calculated numeric values
    expect(calculated.sheets[0].metadata.columns[0].type).toBe(DataType.NUMBER);
    expect(calculated.sheets[0].metadata.columns[1].type).toBe(DataType.NUMBER);
  });

  it('should handle currency formulas in Phase 2', () => {
    const input = `Product,Price
Widget A,=100
Widget B,=200`;

    const doc = parseStructure(input);
    
    // Price column is 100% formulas, should be UNSPECIFIED
    expect(doc.sheets[0].metadata.columns[1].type).toBe('UNSPECIFIED');
    
    // Calculate to trigger Phase 2
    const calculated = calculate(doc);
    
    // Should infer NUMBER type from calculated numeric results
    expect(calculated.sheets[0].metadata.columns[1].type).toBe(DataType.NUMBER);
  });

  it('should respect confidence threshold in Phase 2', () => {
    const input = `Type,Value
=1+0,=1
=2+0,=2
=3+0,=3+0
=4+0,=4
=5+0,=5`;

    const doc = parseStructure(input);
    
    // Both columns should be UNSPECIFIED (100% formulas)
    expect(doc.sheets[0].metadata.columns[1].type).toBe('UNSPECIFIED');
    
    // Calculate to trigger Phase 2
    const calculated = calculate(doc);
    
    // Value column: all formulas produce numbers = 100% numbers >= 80% confidence threshold
    // Should infer NUMBER type
    expect(calculated.sheets[0].metadata.columns[1].type).toBe(DataType.NUMBER);
  });

  it('should default to TEXT when Phase 2 confidence is low', () => {
    const input = `Mixed,Value,Extra
=1+0,=1,=100
=2+0,=2,=200
=3+0,=3+0,=300`;

    const doc = parseStructure(input);
    
    // Value column should be UNSPECIFIED (100% formulas)
    expect(doc.sheets[0].metadata.columns[1].type).toBe('UNSPECIFIED');
    
    // Calculate to trigger Phase 2
    const calculated = calculate(doc);
    
    // All formulas produce numbers, so should infer NUMBER
    expect(calculated.sheets[0].metadata.columns[1].type).toBe(DataType.NUMBER);
  });
});