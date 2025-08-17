import { describe, it, expect, vi } from 'vitest';
import { parseStructure } from '../../../src/core/parser/index';

describe('Metadata Parsing', () => {
  it('should parse document metadata from ## comments', () => {
    const rcsv = `## title=Budget Tracker
## author=John Doe
## version=1.0
Category:text,Amount:currency
Food,100`;

    const result = parseStructure(rcsv);
    
    expect(result.metadata.title).toBe('Budget Tracker');
    expect(result.metadata.author).toBe('John Doe');
    expect(result.metadata.version).toBe('1.0');
  });

  it('should handle quoted metadata values', () => {
    const rcsv = `## title="My Budget"
## description='A detailed budget tracker'
Category:text,Amount:currency
Food,100`;

    const result = parseStructure(rcsv);
    
    expect(result.metadata.title).toBe('My Budget');
    expect(result.metadata.description).toBe('A detailed budget tracker');
  });

  it('should parse chart metadata correctly', () => {
    const rcsv = `## Chart: type=bar, title="Budget Overview", x=Category, y=Amount
Category:text,Amount:currency
Food,100
Housing,2000`;

    const result = parseStructure(rcsv);
    
    expect(result.sheets[0].charts).toHaveLength(1);
    const chart = result.sheets[0].charts[0];
    expect(chart.type).toBe('bar');
    expect(chart.title).toBe('Budget Overview');
    expect(chart.x).toBe('Category');
    expect(chart.y).toBe('Amount');
  });

  it('should handle multiple chart definitions', () => {
    const rcsv = `## Chart: type=bar, title="Chart 1", x=Category, y=Amount
## Chart: type=pie, title="Chart 2", labels=Category, values=Amount
Category:text,Amount:currency
Food,100`;

    const result = parseStructure(rcsv);
    
    expect(result.sheets[0].charts).toHaveLength(2);
    expect(result.sheets[0].charts[0].type).toBe('bar');
    expect(result.sheets[0].charts[1].type).toBe('pie');
  });

  it('should handle chart with multiple y values', () => {
    const rcsv = `## Chart: type=line, x=Month, y="Revenue,Expenses"
Month:text,Revenue:currency,Expenses:currency
Jan,1000,800`;

    const result = parseStructure(rcsv);
    
    const chart = result.sheets[0].charts[0];
    expect(chart.y).toEqual(['Revenue', 'Expenses']);
  });

  it('should warn about invalid chart types', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const rcsv = `## Chart: type=invalid, title="Test"
Category:text,Amount:currency
Food,100`;

    const result = parseStructure(rcsv);
    
    expect(result.sheets[0].charts).toHaveLength(0);
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should skip empty lines in metadata section', () => {
    const rcsv = `## title=Test

## author=John


Category:text,Amount:currency
Food,100`;

    const result = parseStructure(rcsv);
    
    expect(result.metadata.title).toBe('Test');
    expect(result.metadata.author).toBe('John');
  });
});