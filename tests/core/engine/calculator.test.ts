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

    it('should calculate ABS with positive number', () => {
      const rcsv = `Value:number,Absolute:number
5,=ABS(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(5);
    });

    it('should calculate ABS with negative number', () => {
      const rcsv = `Value:number,Absolute:number
-7,=ABS(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(7);
    });

    it('should calculate ABS with formula result', () => {
      const rcsv = `A:number,B:number,Difference:number,AbsDiff:number
10,15,=A2-B2,=ABS(C2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe(-5); // A2-B2 = 10-15 = -5
      expect(result.sheets[0].data[0][3].value).toBe(5);  // ABS(-5) = 5
    });

    it('should handle ABS with invalid argument count', () => {
      const rcsv = `Value:number,Result:number
5,"=ABS(A2,B2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].error).toContain('ABS function requires exactly 1 argument');
    });

    it('should calculate ROUND with positive decimal places', () => {
      const rcsv = `Value:number,Rounded:number
3.14159,"=ROUND(A2,2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(3.14);
    });

    it('should calculate ROUND with zero decimal places', () => {
      const rcsv = `Value:number,Rounded:number
3.7,"=ROUND(A2,0)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(4);
    });

    it('should calculate ROUND with negative decimal places', () => {
      const rcsv = `Value:number,Rounded:number
1234.5678,"=ROUND(A2,-2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(1200);
    });

    it('should calculate ROUND with formula results', () => {
      const rcsv = `A:number,B:number,Division:number,Rounded:number
22,7,"=A2/B2","=ROUND(C2,3)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBeCloseTo(3.142857142857143);
      expect(result.sheets[0].data[0][3].value).toBe(3.143);
    });

    it('should handle ROUND with invalid argument count', () => {
      const rcsv = `Value:number,Result:number
5,"=ROUND(A2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].error).toContain('ROUND function requires exactly 2 arguments');
    });

    it('should calculate COUNTA with mixed data types', () => {
      const rcsv = `A:text,B:number,C:text,CountAll:number
Hello,10,World,=COUNTA(A2:C2)
,20,,=COUNTA(A3:C3)
Text,,"",=COUNTA(A4:C4)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][3].value).toBe(3); // "Hello", 10, "World"
      expect(result.sheets[0].data[1][3].value).toBe(1); // null, 20, null
      expect(result.sheets[0].data[2][3].value).toBe(2); // "Text", null, "" (quoted empty string counts)
    });

    it('should calculate COUNTA with individual cells', () => {
      const rcsv = `A:text,B:number,C:boolean,CountAll:number
Test,42,true,"=COUNTA(A2,B2,C2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][3].value).toBe(3);
    });

    it('should calculate COUNTA vs COUNT difference', () => {
      const rcsv = `A:text,B:number,C:text,CountNums:number,CountAll:number
Text,10,More,"=COUNT(A2:C2)","=COUNTA(A2:C2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][3].value).toBe(1); // COUNT only counts numbers (10)
      expect(result.sheets[0].data[0][4].value).toBe(3); // COUNTA counts all non-empty ("Text", 10, "More")
    });

    it('should calculate COUNTA with empty cells', () => {
      const rcsv = `A:text,B:text,C:text,CountAll:number
Value1,,Value3,=COUNTA(A2:C2)
,,"",=COUNTA(A3:C3)
,,Value6,=COUNTA(A4:C4)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][3].value).toBe(2); // "Value1", null, "Value3"
      expect(result.sheets[0].data[1][3].value).toBe(1); // null, null, "" (quoted empty string counts)
      expect(result.sheets[0].data[2][3].value).toBe(1); // null, null, "Value6"
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

    it('should handle complex text function combinations', () => {
      const rcsv = `Name:text,Email:text,Domain:text,Username:text,Formatted:text
John Smith,john.smith@company.com,"=RIGHT(B2,LEN(B2)-FIND(""@"",B2))","=LEFT(B2,FIND(""@"",B2)-1)","=UPPER(LEFT(A2,1)) & LOWER(RIGHT(A2,LEN(A2)-FIND("" "",A2)))"`;  
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe('company.com');    // Domain
      expect(result.sheets[0].data[0][3].value).toBe('john.smith');     // Username
      expect(result.sheets[0].data[0][4].value).toBe('Jsmith');         // Formatted name
    });

    it('should handle text functions with mathematical operations', () => {
      const rcsv = `Text:text,Number:number,Length:number,Repeated:text,Value:number
"123",456,=LEN(A2),"=REPT(A2,B2/100)","=VALUE(A2)+B2"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe(3);          // Length of "123"
      expect(result.sheets[0].data[0][3].value).toBe('123123123123'); // "123" repeated 4.56 times (4 times)
      expect(result.sheets[0].data[0][4].value).toBe(579);        // 123 + 456
    });

    it('should handle nested text functions', () => {
      const rcsv = `Text:text,Result:text
"  HELLO WORLD  ",=TRIM(LOWER(A2))`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('hello world');
    });

    it('should handle text functions in conditional logic', () => {
      const rcsv = `Name:text,Valid:text,Length:number,Message:text
John,"=IF(LEN(A2)>3,""Valid"",""Invalid"")",=LEN(A2),"=CONCATENATE(""Name: "",A2,"" - "",B2)"
Al,"=IF(LEN(A2)>3,""Valid"",""Invalid"")",=LEN(A2),"=CONCATENATE(""Name: "",A2,"" - "",B2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Valid');                    // John is valid
      expect(result.sheets[0].data[0][2].value).toBe(4);                          // John length
      expect(result.sheets[0].data[0][3].value).toBe('Name: John - Valid');       // John message
      expect(result.sheets[0].data[1][1].value).toBe('Invalid');                  // Al is invalid  
      expect(result.sheets[0].data[1][2].value).toBe(2);                          // Al length
      expect(result.sheets[0].data[1][3].value).toBe('Name: Al - Invalid');       // Al message
    });

    it('should handle text formatting with numbers', () => {
      const rcsv = `Amount:number,Percentage:number,Currency:text,Percent:text,Fixed:text
1234.5678,0.1234,"=TEXT(A2,""#,##0.00"")","=TEXT(B2,""0.00%"")","=TEXT(A2,""0.00"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe('1,234.57');      // Currency format
      expect(result.sheets[0].data[0][3].value).toBe('12.34%');        // Percentage format  
      expect(result.sheets[0].data[0][4].value).toBe('1234.57');       // Fixed decimal
    });
  });
});