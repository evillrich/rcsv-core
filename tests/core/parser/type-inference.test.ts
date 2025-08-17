import { describe, it, expect } from 'vitest';
import { parseStructure } from '../../../src/core/parser/index';

describe('Type Inference', () => {
  it('should infer number types correctly', () => {
    const rcsv = `Value
123
456.78
1000
-42.5`;

    const result = parseStructure(rcsv);
    
    expect(result.sheets[0].metadata.columns[0].type).toBe('number');
    expect(result.sheets[0].data[0][0].value).toBe(123);
    expect(result.sheets[0].data[1][0].value).toBe(456.78);
    expect(result.sheets[0].data[2][0].value).toBe(1000);
    expect(result.sheets[0].data[3][0].value).toBe(-42.5);
  });

  it('should infer currency types correctly', () => {
    const rcsv = `Price
$100
$2500.50
€150
¥1000`;

    const result = parseStructure(rcsv);
    
    expect(result.sheets[0].metadata.columns[0].type).toBe('currency');
    expect(result.sheets[0].data[0][0].value).toBe(100);
    expect(result.sheets[0].data[1][0].value).toBe(2500.50);
    expect(result.sheets[0].data[2][0].value).toBe(150);
    expect(result.sheets[0].data[3][0].value).toBe(1000);
  });

  it('should infer percentage types correctly', () => {
    const rcsv = `Completion
95%
87.5%
100%
0%`;

    const result = parseStructure(rcsv);
    
    expect(result.sheets[0].metadata.columns[0].type).toBe('percentage');
    expect(result.sheets[0].data[0][0].value).toBe(0.95);
    expect(result.sheets[0].data[1][0].value).toBe(0.875);
    expect(result.sheets[0].data[2][0].value).toBe(1.0);
    expect(result.sheets[0].data[3][0].value).toBe(0.0);
  });

  it('should infer boolean types correctly', () => {
    const rcsv = `Active
true
false
yes
no
y
n`;

    const result = parseStructure(rcsv);
    
    expect(result.sheets[0].metadata.columns[0].type).toBe('boolean');
    expect(result.sheets[0].data[0][0].value).toBe(true);
    expect(result.sheets[0].data[1][0].value).toBe(false);
    expect(result.sheets[0].data[2][0].value).toBe(true);
    expect(result.sheets[0].data[3][0].value).toBe(false);
    expect(result.sheets[0].data[4][0].value).toBe(true);
    expect(result.sheets[0].data[5][0].value).toBe(false);
  });

  it('should infer date types correctly', () => {
    const rcsv = `Date
2023-01-15
2022-12-31
2024-06-01`;

    const result = parseStructure(rcsv);
    
    expect(result.sheets[0].metadata.columns[0].type).toBe('date');
    expect(result.sheets[0].data[0][0].value).toBeInstanceOf(Date);
    expect(result.sheets[0].data[1][0].value).toBeInstanceOf(Date);
    expect(result.sheets[0].data[2][0].value).toBeInstanceOf(Date);
  });

  it('should respect explicit type annotations over inference', () => {
    const rcsv = `ID:text,Amount
001,100
002,200
003,300`;

    const result = parseStructure(rcsv);
    
    // ID column should remain text despite looking like numbers
    expect(result.sheets[0].metadata.columns[0].type).toBe('text');
    expect(result.sheets[0].data[0][0].value).toBe('001');
    
    // Amount column should be inferred as number
    expect(result.sheets[0].metadata.columns[1].type).toBe('number');
    expect(result.sheets[0].data[0][1].value).toBe(100);
  });

  it('should fall back to text for mixed data', () => {
    const rcsv = `Mixed
123
hello
456
world`;

    const result = parseStructure(rcsv);
    
    expect(result.sheets[0].metadata.columns[0].type).toBe('text');
  });

  it('should use confidence threshold for type inference', () => {
    // 75% numbers, 25% text - should infer as text with 80% threshold
    const rcsv = `Values
123
456
789
text`;

    const result = parseStructure(rcsv);
    
    expect(result.sheets[0].metadata.columns[0].type).toBe('text');
  });

  it('should prioritize specific types over general ones', () => {
    const rcsv = `Values
$100
$200
$300`;

    const result = parseStructure(rcsv);
    
    // Should be currency, not number, even though both would match
    expect(result.sheets[0].metadata.columns[0].type).toBe('currency');
  });

  it('should handle empty cells in type inference', () => {
    const rcsv = `Values
123

456

789`;

    const result = parseStructure(rcsv);
    
    expect(result.sheets[0].metadata.columns[0].type).toBe('number');
  });

  it('should handle mixed formulas and values with Phase 1', () => {
    const rcsv = `Values
123
456
789
=A1+100`;

    const result = parseStructure(rcsv);
    
    // 3 values, 1 formula = 25% formulas < 50% threshold
    // Should infer based on non-formula values in Phase 1
    expect(result.sheets[0].metadata.columns[0].type).toBe('number');
    expect(result.sheets[0].data[0][0].value).toBe(123);
    expect(result.sheets[0].data[1][0].value).toBe(456);
  });
});