import { describe, it, expect } from 'vitest';
import { parseStructure } from '../../../src/core/parser/index';

describe('Formula Quoting Requirements', () => {
  describe('Simple formulas without commas', () => {
    it('should handle unquoted simple formulas', () => {
      const rcsv = `A:number,B:number,Result:number
10,20,=A1+B1
5,15,=A2*B2`;

      const result = parseStructure(rcsv);
      
      expect(result.sheets[0].data[0][2].formula).toBe('=A1+B1');
      expect(result.sheets[0].data[1][2].formula).toBe('=A2*B2');
    });

    it('should handle unquoted formulas with ranges', () => {
      const rcsv = `Values:number,Total:number
10,=SUM(A1:A3)
20,
30,`;

      const result = parseStructure(rcsv);
      
      expect(result.sheets[0].data[0][1].formula).toBe('=SUM(A1:A3)');
    });
  });

  describe('Complex formulas with commas - must be quoted', () => {
    it('should handle quoted formulas with multiple arguments', () => {
      const rcsv = `A:number,B:number,C:number,Result:number
10,20,30,"=SUM(A1,B1,C1)"
5,15,25,"=MAX(A2,B2,C2)"`;

      const result = parseStructure(rcsv);
      
      expect(result.sheets[0].data[0][3].formula).toBe('=SUM(A1,B1,C1)');
      expect(result.sheets[0].data[1][3].formula).toBe('=MAX(A2,B2,C2)');
    });

    it('should handle quoted nested functions', () => {
      const rcsv = `A:number,Result:number
10,"=SUM(A1,AVERAGE(A1:A3),MAX(A1:A5))"`;

      const result = parseStructure(rcsv);
      
      expect(result.sheets[0].data[0][1].formula).toBe('=SUM(A1,AVERAGE(A1:A3),MAX(A1:A5))');
    });

    it('should handle quoted formulas with mixed arguments', () => {
      const rcsv = `A:number,B:number,C:number,Result:number
10,20,30,"=SUM(A1:B1,C1)"`;

      const result = parseStructure(rcsv);
      
      expect(result.sheets[0].data[0][3].formula).toBe('=SUM(A1:B1,C1)');
    });
  });

  describe('Mixed scenarios', () => {
    it('should handle mix of quoted and unquoted formulas correctly', () => {
      const rcsv = `A:number,B:number,Simple:number,Complex:number
10,20,=A1+B1,"=SUM(A1,B1)"
5,15,=A2*2,"=AVERAGE(A1:A2)"`;

      const result = parseStructure(rcsv);
      
      // Simple formulas (no commas)
      expect(result.sheets[0].data[0][2].formula).toBe('=A1+B1');
      expect(result.sheets[0].data[1][2].formula).toBe('=A2*2');
      
      // Complex formulas (with commas, quoted)
      expect(result.sheets[0].data[0][3].formula).toBe('=SUM(A1,B1)');
      expect(result.sheets[0].data[1][3].formula).toBe('=AVERAGE(A1:A2)');
    });

    it('should preserve quoted non-formula text', () => {
      const rcsv = `Name:text,Note:text,Amount:number
"Smith, John","Has, commas",100
Jane,"Simple note",200`;

      const result = parseStructure(rcsv);
      
      expect(result.sheets[0].data[0][0].value).toBe('Smith, John');
      expect(result.sheets[0].data[0][1].value).toBe('Has, commas');
      expect(result.sheets[0].data[1][0].value).toBe('Jane');
      expect(result.sheets[0].data[1][1].value).toBe('Simple note');
    });
  });

  describe('Edge cases', () => {
    it('should handle formulas with quoted strings inside', () => {
      const rcsv = `Text:text,Result:number
test,"=IF(A1=""hello"",1,0)"`;

      const result = parseStructure(rcsv);
      
      expect(result.sheets[0].data[0][1].formula).toBe('=IF(A1="hello",1,0)');
    });

    it('should handle empty cells correctly', () => {
      const rcsv = `A:number,B:number,C:number
10,,=A1*2
,20,"=SUM(A1,B2)"`;

      const result = parseStructure(rcsv);
      
      expect(result.sheets[0].data[0][1].value).toBe('');
      expect(result.sheets[0].data[0][2].formula).toBe('=A1*2');
      expect(result.sheets[0].data[1][0].value).toBe('');
      expect(result.sheets[0].data[1][2].formula).toBe('=SUM(A1,B2)');
    });
  });
});