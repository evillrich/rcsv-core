import { describe, it, expect } from 'vitest';
import { parseStructure } from '../../../src/core/parser';

describe('Chart Metadata Parsing', () => {
  describe('Basic chart parsing', () => {
    it('should parse a simple bar chart', () => {
      const input = `## Chart: type=bar, title=Sales, x=Month, y=Revenue
Month,Revenue
Jan,1000
Feb,1200`;

      const doc = parseStructure(input);
      expect(doc.sheets[0].charts).toHaveLength(1);
      
      const chart = doc.sheets[0].charts[0];
      expect(chart.type).toBe('bar');
      expect(chart.title).toBe('Sales');
      expect(chart.x).toBe('Month');
      expect(chart.y).toBe('Revenue');
    });

    it('should parse all chart types', () => {
      const types = ['bar', 'column', 'line', 'pie', 'scatter'];
      
      types.forEach(type => {
        const input = `## Chart: type=${type}
Data,Value
A,10`;
        
        const doc = parseStructure(input);
        expect(doc.sheets[0].charts[0].type).toBe(type);
      });
    });
  });

  describe('Quoted values', () => {
    it('should handle titles with commas', () => {
      const input = `## Chart: type=bar, title="Q4 Report, Final", x=Month, y=Sales
Month,Sales
Jan,1000`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      expect(chart.title).toBe('Q4 Report, Final');
    });

    it('should handle titles with equals signs', () => {
      const input = `## Chart: type=bar, title="Revenue = Expenses + Profit", x=Month
Month,Value
Jan,100`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      expect(chart.title).toBe('Revenue = Expenses + Profit');
    });

    it('should handle escaped quotes using CSV-style doubling', () => {
      const input = `## Chart: type=bar, title="Sales ""2024"" Report", x=Month
Month,Value
Jan,100`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      expect(chart.title).toBe('Sales "2024" Report');
    });

    it('should handle single quotes with doubling', () => {
      const input = `## Chart: type=bar, title='John''s Report', x=Month
Month,Value
Jan,100`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      expect(chart.title).toBe("John's Report");
    });
  });

  describe('Multiple values (comma-separated lists)', () => {
    it('should parse multiple y columns', () => {
      const input = `## Chart: type=line, x=Month, y=Revenue,Expenses,Profit
Month,Revenue,Expenses,Profit
Jan,1000,800,200`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      expect(chart.y).toEqual(['Revenue', 'Expenses', 'Profit']);
    });

    it('should handle mixed quoted and unquoted column names', () => {
      const input = `## Chart: type=line, x=Month, y="Revenue, After Tax",Expenses,"Profit, Net"
Month,"Revenue, After Tax",Expenses,"Profit, Net"
Jan,1000,800,200`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      expect(chart.y).toEqual(['Revenue, After Tax', 'Expenses', 'Profit, Net']);
    });

    it('should handle series names with commas', () => {
      const input = `## Chart: type=line, x=Month, y=Col1,Col2, series="Series, One","Series, Two"
Month,Col1,Col2
Jan,100,200`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      expect(chart.series).toEqual(['Series, One', 'Series, Two']);
    });
  });

  describe('Pie chart specific fields', () => {
    it('should parse pie chart with labels and values', () => {
      const input = `## Chart: type=pie, title="Distribution", labels=Category, values=Amount
Category,Amount
A,100
B,200`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      expect(chart.type).toBe('pie');
      expect(chart.labels).toBe('Category');
      expect(chart.values).toBe('Amount');
    });

    it('should handle quoted labels and values columns', () => {
      const input = `## Chart: type=pie, labels="Category, Type", values="Amount, Total"
"Category, Type","Amount, Total"
"Type A",100`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      expect(chart.labels).toBe('Category, Type');
      expect(chart.values).toBe('Amount, Total');
    });
  });

  describe('Edge cases', () => {
    it('should handle charts with minimal metadata', () => {
      const input = `## Chart: type=bar
Data,Value
A,10`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      expect(chart.type).toBe('bar');
      expect(chart.title).toBeUndefined();
      expect(chart.x).toBeUndefined();
      expect(chart.y).toBeUndefined();
    });

    it('should skip charts with missing type', () => {
      const input = `## Chart: title="Missing Type", x=Month, y=Value
Month,Value
Jan,100`;

      const doc = parseStructure(input);
      expect(doc.sheets[0].charts).toHaveLength(0);
    });

    it('should handle multiple charts per sheet', () => {
      const input = `## Chart: type=bar, title="Chart 1", x=Month, y=Sales
## Chart: type=line, title="Chart 2", x=Month, y=Revenue,Expenses
## Chart: type=pie, title="Chart 3", labels=Category, values=Amount
Month,Sales,Revenue,Expenses,Category,Amount
Jan,100,200,150,A,50`;

      const doc = parseStructure(input);
      expect(doc.sheets[0].charts).toHaveLength(3);
      
      expect(doc.sheets[0].charts[0].type).toBe('bar');
      expect(doc.sheets[0].charts[0].title).toBe('Chart 1');
      
      expect(doc.sheets[0].charts[1].type).toBe('line');
      expect(doc.sheets[0].charts[1].y).toEqual(['Revenue', 'Expenses']);
      
      expect(doc.sheets[0].charts[2].type).toBe('pie');
      expect(doc.sheets[0].charts[2].labels).toBe('Category');
    });

    it('should handle whitespace around values', () => {
      const input = `## Chart: type = bar , title = "My Chart" , x = Month , y = Value
Month,Value
Jan,100`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      expect(chart.type).toBe('bar');
      expect(chart.title).toBe('My Chart');
      expect(chart.x).toBe('Month');
      expect(chart.y).toBe('Value');
    });

    it('should handle empty quoted strings', () => {
      const input = `## Chart: type=bar, title="", x=Month
Month,Value
Jan,100`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      expect(chart.title).toBe('');
    });
  });

  describe('Complex escaping scenarios', () => {
    it('should handle multiple escaped quotes', () => {
      const input = `## Chart: type=bar, title="He said ""Hello"" and ""Goodbye""", x=Month
Month,Value
Jan,100`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      expect(chart.title).toBe('He said "Hello" and "Goodbye"');
    });

    it('should handle quotes at start and end', () => {
      const input = `## Chart: type=bar, title="""Quoted"" Text", x=Month
Month,Value
Jan,100`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      expect(chart.title).toBe('"Quoted" Text');
    });

    it('should handle complex multi-column with quotes and commas', () => {
      const input = `## Chart: type=line, x="Month, Year", y="Revenue (USD)","Expenses, Total","""Profit"""
"Month, Year","Revenue (USD)","Expenses, Total","""Profit"""
"Jan, 2024",1000,800,200`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      expect(chart.x).toBe('Month, Year');
      expect(chart.y).toEqual(['Revenue (USD)', 'Expenses, Total', '"Profit"']);
    });
  });
});