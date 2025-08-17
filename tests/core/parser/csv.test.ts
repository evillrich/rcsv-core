import { describe, it, expect } from 'vitest';
import { parseStructure } from '../../../src/core/parser/index';

describe('CSV Parsing', () => {
  it('should parse basic CSV data', () => {
    const rcsv = `Category:text,Amount:currency
Food,100
Housing,2000`;

    const result = parseStructure(rcsv);
    
    expect(result.sheets[0].data).toHaveLength(2);
    expect(result.sheets[0].data[0][0].raw).toBe('Food');
    expect(result.sheets[0].data[0][1].raw).toBe('100');
    expect(result.sheets[0].data[1][0].raw).toBe('Housing');
    expect(result.sheets[0].data[1][1].raw).toBe('2000');
  });

  it('should parse column headers with type annotations', () => {
    const rcsv = `Name:text,Age:number,Income:currency,Active:boolean,Date:date
John,25,$50000,yes,2023-01-15`;

    const result = parseStructure(rcsv);
    
    const columns = result.sheets[0].metadata.columns;
    expect(columns).toHaveLength(5);
    expect(columns[0]).toEqual({ name: 'Name', type: 'text' });
    expect(columns[1]).toEqual({ name: 'Age', type: 'number' });
    expect(columns[2]).toEqual({ name: 'Income', type: 'currency' });
    expect(columns[3]).toEqual({ name: 'Active', type: 'boolean' });
    expect(columns[4]).toEqual({ name: 'Date', type: 'date' });
  });

  it('should detect formulas', () => {
    const rcsv = `A:number,B:number,Total:number
10,20,=A1+B1
5,15,=A2+B2`;

    const result = parseStructure(rcsv);
    
    expect(result.sheets[0].data[0][2].formula).toBe('=A1+B1');
    expect(result.sheets[0].data[0][2].value).toBeNull();
    expect(result.sheets[0].data[1][2].formula).toBe('=A2+B2');
    expect(result.sheets[0].data[1][2].value).toBeNull();
  });

  it('should handle quoted CSV fields', () => {
    const rcsv = `Name:text,Description:text
"John, Jr.","A person with, commas"
Jane,"Simple description"`;

    const result = parseStructure(rcsv);
    
    expect(result.sheets[0].data[0][0].raw).toBe('John, Jr.');
    expect(result.sheets[0].data[0][1].raw).toBe('A person with, commas');
    expect(result.sheets[0].data[1][0].raw).toBe('Jane');
    expect(result.sheets[0].data[1][1].raw).toBe('Simple description');
  });

  it('should calculate memory statistics', () => {
    const rcsv = `A:text,B:text,C:text
1,2,3
4,5,6
7,8,9`;

    const result = parseStructure(rcsv);
    
    expect(result.memoryStats.estimatedRows).toBe(3);
    expect(result.memoryStats.estimatedMemoryMB).toBeGreaterThanOrEqual(0);
    expect(result.sheets[0].rowCount).toBe(3);
    expect(result.sheets[0].columnCount).toBe(3);
  });

  it('should handle empty CSV gracefully', () => {
    const rcsv = `## title=Empty Test
A:text`;

    const result = parseStructure(rcsv);
    
    expect(result.sheets[0].data).toHaveLength(0);
    expect(result.memoryStats.estimatedRows).toBe(0);
  });

  it('should trim whitespace from cell values', () => {
    const rcsv = `Name:text,Amount:number
  John  ,  100  
  Jane  ,  200  `;

    const result = parseStructure(rcsv);
    
    expect(result.sheets[0].data[0][0].raw).toBe('John');
    expect(result.sheets[0].data[0][1].raw).toBe('100');
    expect(result.sheets[0].data[1][0].raw).toBe('Jane');
    expect(result.sheets[0].data[1][1].raw).toBe('200');
  });
});