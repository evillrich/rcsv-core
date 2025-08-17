import { describe, it, expect } from 'vitest';
import { parseFormula } from '../../../src/core/parser/formula';

describe('Formula Parser', () => {
  describe('Basic Numbers', () => {
    it('should parse simple numbers', () => {
      const ast = parseFormula('=42');
      expect(ast).toEqual({
        type: 'number',
        value: 42
      });
    });

    it('should parse decimal numbers', () => {
      const ast = parseFormula('=3.14');
      expect(ast).toEqual({
        type: 'number',
        value: 3.14
      });
    });

    it('should parse negative numbers', () => {
      const ast = parseFormula('=-5');
      expect(ast).toEqual({
        type: 'unary',
        op: '-',
        operand: { type: 'number', value: 5 }
      });
    });
  });

  describe('Cell References', () => {
    it('should parse simple cell references', () => {
      const ast = parseFormula('=A1');
      expect(ast).toEqual({
        type: 'cell',
        ref: 'A1'
      });
    });

    it('should parse multi-character column references', () => {
      const ast = parseFormula('=AB123');
      expect(ast).toEqual({
        type: 'cell',
        ref: 'AB123'
      });
    });

    it('should parse range references', () => {
      const ast = parseFormula('=A1:B2');
      expect(ast).toEqual({
        type: 'range',
        start: 'A1',
        end: 'B2'
      });
    });
  });

  describe('Basic Math Operations', () => {
    it('should parse addition', () => {
      const ast = parseFormula('=1+2');
      expect(ast).toEqual({
        type: 'binary',
        op: '+',
        left: { type: 'number', value: 1 },
        right: { type: 'number', value: 2 }
      });
    });

    it('should parse subtraction', () => {
      const ast = parseFormula('=5-3');
      expect(ast).toEqual({
        type: 'binary',
        op: '-',
        left: { type: 'number', value: 5 },
        right: { type: 'number', value: 3 }
      });
    });

    it('should parse multiplication', () => {
      const ast = parseFormula('=2*3');
      expect(ast).toEqual({
        type: 'binary',
        op: '*',
        left: { type: 'number', value: 2 },
        right: { type: 'number', value: 3 }
      });
    });

    it('should parse division', () => {
      const ast = parseFormula('=8/2');
      expect(ast).toEqual({
        type: 'binary',
        op: '/',
        left: { type: 'number', value: 8 },
        right: { type: 'number', value: 2 }
      });
    });

    it('should parse power operations', () => {
      const ast = parseFormula('=2^3');
      expect(ast).toEqual({
        type: 'binary',
        op: '^',
        left: { type: 'number', value: 2 },
        right: { type: 'number', value: 3 }
      });
    });
  });

  describe('Operator Precedence', () => {
    it('should handle multiplication before addition', () => {
      const ast = parseFormula('=1+2*3');
      expect(ast).toEqual({
        type: 'binary',
        op: '+',
        left: { type: 'number', value: 1 },
        right: {
          type: 'binary',
          op: '*',
          left: { type: 'number', value: 2 },
          right: { type: 'number', value: 3 }
        }
      });
    });

    it('should handle power before multiplication', () => {
      const ast = parseFormula('=2*3^2');
      expect(ast).toEqual({
        type: 'binary',
        op: '*',
        left: { type: 'number', value: 2 },
        right: {
          type: 'binary',
          op: '^',
          left: { type: 'number', value: 3 },
          right: { type: 'number', value: 2 }
        }
      });
    });

    it('should handle parentheses', () => {
      const ast = parseFormula('=(1+2)*3');
      expect(ast).toEqual({
        type: 'binary',
        op: '*',
        left: {
          type: 'binary',
          op: '+',
          left: { type: 'number', value: 1 },
          right: { type: 'number', value: 2 }
        },
        right: { type: 'number', value: 3 }
      });
    });
  });

  describe('Functions', () => {
    it('should parse SUM function with single argument', () => {
      const ast = parseFormula('=SUM(A1)');
      expect(ast).toEqual({
        type: 'function',
        name: 'SUM',
        args: [{ type: 'cell', ref: 'A1' }]
      });
    });

    it('should parse SUM function with range argument', () => {
      const ast = parseFormula('=SUM(A1:B2)');
      expect(ast).toEqual({
        type: 'function',
        name: 'SUM',
        args: [{ type: 'range', start: 'A1', end: 'B2' }]
      });
    });

    it('should parse function with multiple arguments', () => {
      const ast = parseFormula('=SUM(A1,B1,C1)');
      expect(ast).toEqual({
        type: 'function',
        name: 'SUM',
        args: [
          { type: 'cell', ref: 'A1' },
          { type: 'cell', ref: 'B1' },
          { type: 'cell', ref: 'C1' }
        ]
      });
    });

    it('should parse function with no arguments', () => {
      const ast = parseFormula('=COUNT()');
      expect(ast).toEqual({
        type: 'function',
        name: 'COUNT',
        args: []
      });
    });

    it('should handle case-insensitive function names', () => {
      const ast = parseFormula('=sum(A1)');
      expect(ast).toEqual({
        type: 'function',
        name: 'SUM',
        args: [{ type: 'cell', ref: 'A1' }]
      });
    });
  });

  describe('Complex Expressions', () => {
    it('should parse cell reference arithmetic', () => {
      const ast = parseFormula('=A1+B1');
      expect(ast).toEqual({
        type: 'binary',
        op: '+',
        left: { type: 'cell', ref: 'A1' },
        right: { type: 'cell', ref: 'B1' }
      });
    });

    it('should parse mixed expressions', () => {
      const ast = parseFormula('=A1*2+B1');
      expect(ast).toEqual({
        type: 'binary',
        op: '+',
        left: {
          type: 'binary',
          op: '*',
          left: { type: 'cell', ref: 'A1' },
          right: { type: 'number', value: 2 }
        },
        right: { type: 'cell', ref: 'B1' }
      });
    });

    it('should parse function in expression', () => {
      const ast = parseFormula('=SUM(A1:A3)*2');
      expect(ast).toEqual({
        type: 'binary',
        op: '*',
        left: {
          type: 'function',
          name: 'SUM',
          args: [{ type: 'range', start: 'A1', end: 'A3' }]
        },
        right: { type: 'number', value: 2 }
      });
    });

    it('should parse nested functions', () => {
      const ast = parseFormula('=SUM(A1,SUM(B1:B3))');
      expect(ast).toEqual({
        type: 'function',
        name: 'SUM',
        args: [
          { type: 'cell', ref: 'A1' },
          {
            type: 'function',
            name: 'SUM',
            args: [{ type: 'range', start: 'B1', end: 'B3' }]
          }
        ]
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error for formula not starting with =', () => {
      expect(() => parseFormula('A1+B1')).toThrow('Formula must start with =');
    });

    it('should throw error for invalid syntax', () => {
      expect(() => parseFormula('=A1+')).toThrow();
    });

    it('should throw error for unmatched parentheses', () => {
      expect(() => parseFormula('=(A1+B1')).toThrow('Expected ) after expression');
    });

    it('should throw error for invalid function syntax', () => {
      expect(() => parseFormula('=SUM(A1')).toThrow('Expected ) after function arguments');
    });
  });

  describe('Whitespace Handling', () => {
    it('should handle spaces in expressions', () => {
      const ast = parseFormula('= A1 + B1 ');
      expect(ast).toEqual({
        type: 'binary',
        op: '+',
        left: { type: 'cell', ref: 'A1' },
        right: { type: 'cell', ref: 'B1' }
      });
    });

    it('should handle spaces in function calls', () => {
      const ast = parseFormula('= SUM( A1 , B1 ) ');
      expect(ast).toEqual({
        type: 'function',
        name: 'SUM',
        args: [
          { type: 'cell', ref: 'A1' },
          { type: 'cell', ref: 'B1' }
        ]
      });
    });
  });
});