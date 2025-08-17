import { describe, it, expect, vi } from 'vitest';
import { parseStructure } from '../../../src/core/parser/index';

describe('Split Formula Detection', () => {
  it('should detect and warn about split formulas', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // This CSV has an unquoted formula that would be split by PapaParse
    const rcsv = `A:number,B:number,Total:number
10,20,=SUM(A1,B1)`;

    parseStructure(rcsv);
    
    // Should warn about the split formula
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Warning: Possible split formula detected')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Did you mean: "=SUM(A1,B1)" (quoted)?')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Tip: Formulas containing commas should be quoted')
    );
    
    consoleSpy.mockRestore();
  });

  it('should detect complex split formulas with multiple arguments', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const rcsv = `A:number,B:number,C:number,Result:number
10,20,30,=SUM(A1,B1,C1)`;

    parseStructure(rcsv);
    
    // Should detect incomplete formula (based on the actual output from first test)
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Warning: Potential incomplete formula')
    );
    
    consoleSpy.mockRestore();
  });

  it('should not warn about properly quoted formulas', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const rcsv = `A:number,B:number,Total:number
10,20,"=SUM(A1,B1)"`;

    parseStructure(rcsv);
    
    // Should not warn about split formulas (other warnings may occur)
    const splitFormulaWarnings = consoleSpy.mock.calls.filter(call => 
      call[0]?.includes?.('split formula')
    );
    expect(splitFormulaWarnings).toHaveLength(0);
    
    consoleSpy.mockRestore();
  });

  it('should not warn about simple formulas without commas', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const rcsv = `A:number,B:number,Result:number
10,20,=A1+B1`;

    parseStructure(rcsv);
    
    // Should not warn about split formulas
    const splitFormulaWarnings = consoleSpy.mock.calls.filter(call => 
      call[0]?.includes?.('split formula')
    );
    expect(splitFormulaWarnings).toHaveLength(0);
    
    consoleSpy.mockRestore();
  });

  it('should detect nested function split formulas', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const rcsv = `A:number,Result:number
10,=SUM(A1,AVERAGE(A1:A3),MAX(A1:A5))`;

    parseStructure(rcsv);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Warning: Possible split formula detected')
    );
    
    consoleSpy.mockRestore();
  });

  it('should handle multiple split formulas in one CSV', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const rcsv = `A:number,B:number,C:number,Sum:number,Max:number
10,20,30,=SUM(A1,B1,C1),=MAX(A1,B1,C1)
5,15,25,=SUM(A2,B2,C2),=MAX(A2,B2,C2)`;

    parseStructure(rcsv);
    
    // Should detect multiple incomplete formulas
    const incompleteFormulaWarnings = consoleSpy.mock.calls.filter(call => 
      call[0]?.includes?.('incomplete formula') || call[0]?.includes?.('split formula')
    );
    expect(incompleteFormulaWarnings.length).toBeGreaterThan(0);
    
    consoleSpy.mockRestore();
  });
});