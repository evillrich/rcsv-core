import { describe, it, expect } from 'vitest';
import { parseStructure } from '../../../src/core/parser';

describe('Layout and Positioning', () => {
  describe('Chart positioning', () => {
    it('should parse chart with default position (bottom)', () => {
      const input = `## Chart: type=bar, title="Sales Chart", x=Month, y=Sales
Month,Sales
Jan,1000
Feb,1200`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      
      expect(chart.position).toBeUndefined(); // Default position is bottom, usually omitted
    });

    it('should parse chart with explicit bottom position', () => {
      const input = `## Chart: type=bar, title="Sales Chart", x=Month, y=Sales, position=bottom
Month,Sales
Jan,1000
Feb,1200`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      
      expect(chart.position).toBe('bottom');
    });

    it('should parse chart with right position', () => {
      const input = `## Chart: type=bar, title="Sales Chart", x=Month, y=Sales, position=right
Month,Sales
Jan,1000
Feb,1200`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      
      expect(chart.position).toBe('right');
    });

    it('should handle quoted position values', () => {
      const input = `## Chart: type=bar, title="Sales Chart", x=Month, y=Sales, position="right"
Month,Sales
Jan,1000
Feb,1200`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      
      expect(chart.position).toBe('right');
    });

    it('should ignore invalid position values', () => {
      const input = `## Chart: type=bar, title="Sales Chart", x=Month, y=Sales, position=invalid
Month,Sales
Jan,1000
Feb,1200`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      
      expect(chart.position).toBeUndefined();
    });

    it('should handle multiple charts with different positions', () => {
      const input = `## Chart: type=bar, title="Chart 1", x=Month, y=Sales
## Chart: type=line, title="Chart 2", x=Month, y=Revenue, position=right
## Chart: type=pie, title="Chart 3", values=Sales, labels=Month, position=bottom
Month,Sales,Revenue
Jan,1000,1100
Feb,1200,1300`;

      const doc = parseStructure(input);
      const charts = doc.sheets[0].charts;
      
      expect(charts).toHaveLength(3);
      expect(charts[0].position).toBeUndefined(); // Default
      expect(charts[1].position).toBe('right');
      expect(charts[2].position).toBe('bottom');
    });
  });

  describe('Table positioning', () => {
    it('should parse table with default position (bottom)', () => {
      const input = `## Chart: type=pie, title="Distribution"
## Table:
Month,Sales
Jan,1000
Feb,1200`;

      const doc = parseStructure(input);
      const tables = doc.sheets[0].metadata.tables;
      
      expect(tables).toHaveLength(1);
      expect(tables[0].position).toBeUndefined(); // Default position is bottom
    });

    it('should parse table with explicit bottom position', () => {
      const input = `## Chart: type=pie, title="Distribution"
## Table: position=bottom
Month,Sales
Jan,1000
Feb,1200`;

      const doc = parseStructure(input);
      const tables = doc.sheets[0].metadata.tables;
      
      expect(tables).toHaveLength(1);
      expect(tables[0].position).toBe('bottom');
    });

    it('should parse table with right position', () => {
      const input = `## Chart: type=pie, title="Distribution"
## Table: position=right
Month,Sales
Jan,1000
Feb,1200`;

      const doc = parseStructure(input);
      const tables = doc.sheets[0].metadata.tables;
      
      expect(tables).toHaveLength(1);
      expect(tables[0].position).toBe('right');
    });

    it('should handle quoted position values for tables', () => {
      const input = `## Chart: type=pie, title="Distribution"
## Table: position="right"
Month,Sales
Jan,1000
Feb,1200`;

      const doc = parseStructure(input);
      const tables = doc.sheets[0].metadata.tables;
      
      expect(tables).toHaveLength(1);
      expect(tables[0].position).toBe('right');
    });

    it('should ignore invalid position values for tables', () => {
      const input = `## Chart: type=pie, title="Distribution"
## Table: position=invalid
Month,Sales
Jan,1000
Feb,1200`;

      const doc = parseStructure(input);
      const tables = doc.sheets[0].metadata.tables;
      
      expect(tables).toHaveLength(1);
      expect(tables[0].position).toBeUndefined();
    });

    it('should handle multiple table declarations', () => {
      const input = `## Chart: type=pie, title="Distribution"
## Table: position=right
## Table: position=bottom
Month,Sales
Jan,1000
Feb,1200`;

      const doc = parseStructure(input);
      const tables = doc.sheets[0].metadata.tables;
      
      expect(tables).toHaveLength(2);
      expect(tables[0].position).toBe('right');
      expect(tables[1].position).toBe('bottom');
    });
  });

  describe('Complex positioning scenarios', () => {
    it('should handle mixed chart and table positioning', () => {
      const input = `## Chart: type=pie, title="Sales Distribution", position=right
## Table: position=bottom
## Chart: type=bar, title="Monthly Trend", x=Month, y=Sales, position=right
Month,Sales,Target
Jan,1000,950
Feb,1200,1100`;

      const doc = parseStructure(input);
      const charts = doc.sheets[0].charts;
      const tables = doc.sheets[0].metadata.tables;
      
      expect(charts).toHaveLength(2);
      expect(charts[0].position).toBe('right');
      expect(charts[1].position).toBe('right');
      
      expect(tables).toHaveLength(1);
      expect(tables[0].position).toBe('bottom');
    });

    it('should handle positioning with other chart properties', () => {
      const input = `## Chart: type=line, title="Complex Chart", x=Month, y="Revenue, After Tax",Expenses, series="Net Revenue","Total Expenses", position=right
Month,"Revenue, After Tax",Expenses
Jan,1000,800
Feb,1200,900`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      
      expect(chart.type).toBe('line');
      expect(chart.title).toBe('Complex Chart');
      expect(chart.x).toBe('Month');
      expect(chart.y).toEqual(['Revenue, After Tax', 'Expenses']);
      expect(chart.series).toEqual(['Net Revenue', 'Total Expenses']);
      expect(chart.position).toBe('right');
    });

    it('should handle positioning across multiple sheets', () => {
      const input = `# Sheet: Sales
## Chart: type=bar, title="Sales Chart", x=Month, y=Sales, position=right
Month,Sales
Jan,1000
Feb,1200

# Sheet: Revenue
## Table: position=right
## Chart: type=line, title="Revenue Trend", x=Month, y=Revenue, position=bottom
Month,Revenue
Jan,1100
Feb,1300`;

      const doc = parseStructure(input);
      
      const salesSheet = doc.sheets.find(s => s.name === 'Sales');
      const revenueSheet = doc.sheets.find(s => s.name === 'Revenue');
      
      expect(salesSheet?.charts[0].position).toBe('right');
      expect(revenueSheet?.metadata.tables[0].position).toBe('right');
      expect(revenueSheet?.charts[0].position).toBe('bottom');
    });

    it('should handle whitespace around position values', () => {
      const input = `## Chart: type=bar, position = right , x=Month
## Table: position = bottom
Month,Sales
Jan,1000`;

      const doc = parseStructure(input);
      
      expect(doc.sheets[0].charts[0].position).toBe('right');
      expect(doc.sheets[0].metadata.tables[0].position).toBe('bottom');
    });

    it('should handle empty table declarations', () => {
      const input = `## Table:
Month,Sales
Jan,1000`;

      const doc = parseStructure(input);
      const tables = doc.sheets[0].metadata.tables;
      
      expect(tables).toHaveLength(1);
      expect(tables[0].position).toBeUndefined();
    });
  });

  describe('Integration with existing features', () => {
    it('should preserve positioning when combined with type annotations', () => {
      const input = `## Chart: type=bar, title="Sales Performance", x=Month, y=Sales, position=right
Month:text,Sales:currency,Target:currency
Jan,1000,950
Feb,1200,1100`;

      const doc = parseStructure(input);
      const chart = doc.sheets[0].charts[0];
      
      expect(chart.position).toBe('right');
      expect(chart.title).toBe('Sales Performance');
      
      // Verify type annotations are preserved
      const columns = doc.sheets[0].metadata.columns;
      expect(columns[0].name).toBe('Month');
      expect(columns[1].name).toBe('Sales');
      expect(columns[2].name).toBe('Target');
    });

    it('should handle positioning with formulas', () => {
      const input = `## Chart: type=bar, title="Budget Analysis", x=Category, y=Budget,Actual,Variance, position=right
## Table: position=bottom
Category:text,Budget:currency,Actual:currency,Variance:currency
Marketing,50000,45000,=C2-B2
Engineering,200000,195000,=C3-B3
Total,=SUM(B2:B3),=SUM(C2:C3),=SUM(D2:D3)`;

      const doc = parseStructure(input);
      
      expect(doc.sheets[0].charts[0].position).toBe('right');
      expect(doc.sheets[0].metadata.tables[0].position).toBe('bottom');
      
      // Verify formulas are preserved
      expect(doc.sheets[0].data[0][3].formula).toBe('=C2-B2');
      expect(doc.sheets[0].data[2][1].formula).toBe('=SUM(B2:B3)');
    });
  });
});