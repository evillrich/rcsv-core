import { describe, it, expect } from 'vitest';
import { calculate } from '../../../src/core/engine/calculator';
import { parseStructure } from '../../../src/core/parser/index';

describe('Calculator Engine', () => {
  describe('Basic Arithmetic', () => {
    it('should calculate simple addition', () => {
      const rcsv = `A:number,B:number,Total:number
10,20,=A2+B2`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe(30);
      expect(result.sheets[0].data[0][2].error).toBeUndefined();
    });

    it('should calculate subtraction', () => {
      const rcsv = `A:number,B:number,Result:number
50,30,=A2-B2`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe(20);
    });

    it('should calculate multiplication', () => {
      const rcsv = `A:number,B:number,Result:number
6,7,=A2*B2`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe(42);
    });

    it('should calculate division', () => {
      const rcsv = `A:number,B:number,Result:number
84,12,=A2/B2`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe(7);
    });

    it('should calculate power operations', () => {
      const rcsv = `A:number,B:number,Result:number
2,3,=A2^B2`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe(8);
    });
  });

  describe('Complex Expressions', () => {
    it('should handle operator precedence', () => {
      const rcsv = `A:number,B:number,C:number,Result:number
2,3,4,=A2+B2*C2`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][3].value).toBe(14); // 2 + (3 * 4)
    });

    it('should handle parentheses', () => {
      const rcsv = `A:number,B:number,C:number,Result:number
2,3,4,=(A2+B2)*C2`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][3].value).toBe(20); // (2 + 3) * 4
    });

    it('should handle negative numbers', () => {
      const rcsv = `A:number,Result:number
10,=-A2`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(-10);
    });
  });

  describe('SUM Function', () => {
    it('should calculate SUM with individual cells', () => {
      const rcsv = `A:number,B:number,C:number,Total:number
10,20,30,"=SUM(A2,B2,C2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][3].value).toBe(60);
    });

    it('should calculate SUM with range', () => {
      const rcsv = `Values:number,Total:number
10,=SUM(A2:A4)
20,
30,`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(60);
    });

    it('should calculate SUM with mixed arguments', () => {
      const rcsv = `A:number,B:number,C:number,Total:number
10,20,30,"=SUM(A2:B2,C2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][3].value).toBe(60);
    });
  });

  describe('Other Functions', () => {
    it('should calculate AVERAGE', () => {
      const rcsv = `Values:number,Average:number
10,=AVERAGE(A2:A4)
20,
30,`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(20);
    });

    it('should calculate COUNT', () => {
      const rcsv = `Values:number,Count:number
10,=COUNT(A2:A4)
20,
30,`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(3);
    });

    it('should calculate MIN', () => {
      const rcsv = `Values:number,Min:number
30,=MIN(A2:A4)
10,
20,`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(10);
    });

    it('should calculate MAX', () => {
      const rcsv = `Values:number,Max:number
10,=MAX(A2:A4)
30,
20,`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(30);
    });
  });

  describe('Dependencies', () => {
    it('should resolve simple dependencies', () => {
      const rcsv = `A:number,B:number,C:number
10,=A2*2,=B2+5`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(20);  // A2 * 2 = 20
      expect(result.sheets[0].data[0][2].value).toBe(25);  // B2 + 5 = 25
    });

    it('should resolve complex dependencies', () => {
      const rcsv = `A:number,B:number,C:number,D:number
10,=A2+5,=B2*2,=C2+A2`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(15);  // A2 + 5 = 15
      expect(result.sheets[0].data[0][2].value).toBe(30);  // B2 * 2 = 30
      expect(result.sheets[0].data[0][3].value).toBe(40);  // C2 + A2 = 40
    });

    it('should handle multi-row dependencies', () => {
      const rcsv = `A:number,B:number
10,=A2*2
=B2+5,=A3*3`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(20);  // A2 * 2 = 20
      expect(result.sheets[0].data[1][0].value).toBe(25);  // B2 + 5 = 25
      expect(result.sheets[0].data[1][1].value).toBe(75);  // A2 * 3 = 75
    });
  });

  describe('Error Handling', () => {
    it('should handle division by zero', () => {
      const rcsv = `A:number,B:number,Result:number
10,0,=A2/B2`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe('#ERROR!');
      expect(result.sheets[0].data[0][2].error).toContain('#DIV/0!');
    });

    it('should handle circular references', () => {
      const rcsv = `A:number,B:number
=B2,=A2`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      // Both cells should show errors due to circular reference
      const hasErrors = result.sheets[0].data[0].every(cell => 
        typeof cell.value === 'string' && cell.value.includes('#')
      );
      expect(hasErrors).toBe(true);
    });

    it('should handle invalid cell references', () => {
      const rcsv = `A:number,Result:number
10,=Z99`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(0); // Missing cells default to 0
    });

    it('should handle invalid function names', () => {
      const rcsv = `A:number,Result:number
10,=INVALID(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('#ERROR!');
      expect(result.sheets[0].data[0][1].error).toContain('Unknown function');
    });
  });

  describe('Type Conversion', () => {
    it('should convert strings to numbers', () => {
      const rcsv = `A:text,Result:number
"42",=A2*2`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(84);
    });

    it('should convert boolean to numbers', () => {
      const rcsv = `A:boolean,B:boolean,Result:number
true,false,=A2+B2`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe(1); // true=1, false=0
    });

    it('should handle non-numeric strings gracefully', () => {
      const rcsv = `A:text,Result:number
"hello",=A2*2`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('#ERROR!');
    });
  });

  describe('Integration', () => {
    it('should calculate the example budget from technical decisions', () => {
      const rcsv = `## Chart: type=bar, title="Budget Overview", x=Category, y=Budget
Category:text,Budget:currency,Actual:currency,Total:currency
Housing,2000,1950,=B2+C2
Food,800,850,=B3+C3
Total,=SUM(B2:B3),=SUM(C2:C3),=SUM(D2:D3)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      // Check individual totals
      expect(result.sheets[0].data[0][3].value).toBe(3950);  // Housing total
      expect(result.sheets[0].data[1][3].value).toBe(1650);  // Food total
      
      // Check budget sums
      expect(result.sheets[0].data[2][1].value).toBe(2800);  // Budget sum
      expect(result.sheets[0].data[2][2].value).toBe(2800);  // Actual sum
      expect(result.sheets[0].data[2][3].value).toBe(5600);  // Total sum
    });
  });
});