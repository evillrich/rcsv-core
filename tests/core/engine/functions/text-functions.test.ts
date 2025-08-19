import { describe, it, expect } from 'vitest';
import { calculate } from '../../../../src/core/engine/calculator';
import { parseStructure } from '../../../../src/core/parser/index';

describe('Text Functions', () => {
  describe('CONCATENATE', () => {
    it('should concatenate multiple strings', () => {
      const rcsv = `A:text,B:text,Result:text
Hello,World,"=CONCATENATE(A2,"" "",B2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe('Hello World');
    });

    it('should concatenate single string', () => {
      const rcsv = `A:text,Result:text
Hello,=CONCATENATE(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Hello');
    });

    it('should concatenate numbers as strings', () => {
      const rcsv = `A:number,B:number,Result:text
123,456,"=CONCATENATE(A2,B2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe('123456');
    });

    it('should handle empty strings', () => {
      const rcsv = `A:text,B:text,Result:text
Hello,"","=CONCATENATE(A2,B2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe('Hello');
    });

    it('should concatenate many arguments', () => {
      const rcsv = `Result:text
"=CONCATENATE(""A"",""B"",""C"",""D"",""E"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][0].value).toBe('ABCDE');
    });
  });

  describe('LEFT', () => {
    it('should return leftmost characters', () => {
      const rcsv = `A:text,Result:text
Hello World,"=LEFT(A2,5)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Hello');
    });

    it('should handle zero length', () => {
      const rcsv = `A:text,Result:text
Hello,"=LEFT(A2,0)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('');
    });

    it('should handle length greater than string length', () => {
      const rcsv = `A:text,Result:text
Hi,"=LEFT(A2,10)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Hi');
    });

    it('should error on negative length', () => {
      const rcsv = `A:text,Result:text
Hello,"=LEFT(A2,-1)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('#ERROR!');
    });

    it('should handle empty string', () => {
      const rcsv = `A:text,Result:text
"","=LEFT(A2,5)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('');
    });

    it('should handle unicode characters', () => {
      const rcsv = `A:text,Result:text
🌟⭐✨,"=LEFT(A2,2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('🌟⭐');
    });
  });

  describe('RIGHT', () => {
    it('should return rightmost characters', () => {
      const rcsv = `A:text,Result:text
Hello World,"=RIGHT(A2,5)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('World');
    });

    it('should handle zero length', () => {
      const rcsv = `A:text,Result:text
Hello,"=RIGHT(A2,0)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('');
    });

    it('should handle length greater than string length', () => {
      const rcsv = `A:text,Result:text
Hi,"=RIGHT(A2,10)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Hi');
    });

    it('should error on negative length', () => {
      const rcsv = `A:text,Result:text
Hello,"=RIGHT(A2,-1)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('#ERROR!');
    });
  });

  describe('MID', () => {
    it('should return middle characters', () => {
      const rcsv = `A:text,Result:text
Hello World,"=MID(A2,7,5)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('World');
    });

    it('should handle start position 1', () => {
      const rcsv = `A:text,Result:text
Hello,"=MID(A2,1,3)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Hel');
    });

    it('should handle zero length', () => {
      const rcsv = `A:text,Result:text
Hello,"=MID(A2,3,0)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('');
    });

    it('should handle length beyond string end', () => {
      const rcsv = `A:text,Result:text
Hello,"=MID(A2,3,10)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('llo');
    });

    it('should error on invalid start position', () => {
      const rcsv = `A:text,Result:text
Hello,"=MID(A2,0,3)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('#ERROR!');
    });

    it('should error on negative length', () => {
      const rcsv = `A:text,Result:text
Hello,"=MID(A2,2,-1)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('#ERROR!');
    });
  });

  describe('LEN', () => {
    it('should return string length', () => {
      const rcsv = `A:text,Result:number
Hello World,=LEN(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(11);
    });

    it('should return zero for empty string', () => {
      const rcsv = `A:text,Result:number
"",=LEN(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(0);
    });

    it('should handle spaces', () => {
      // Test spaces in quoted field - csv-parse should preserve these
      const rcsv = `A:text,Result:number
"   ",=LEN(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(3);
    });

    it('should handle unicode characters', () => {
      const rcsv = `A:text,Result:number
🌟⭐✨,=LEN(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(3);
    });
  });

  describe('UPPER', () => {
    it('should convert to uppercase', () => {
      const rcsv = `A:text,Result:text
Hello World,=UPPER(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('HELLO WORLD');
    });

    it('should handle mixed case', () => {
      const rcsv = `A:text,Result:text
HeLLo WoRLd,=UPPER(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('HELLO WORLD');
    });

    it('should handle numbers and symbols', () => {
      const rcsv = `A:text,Result:text
hello123!,=UPPER(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('HELLO123!');
    });

    it('should handle empty string', () => {
      const rcsv = `A:text,Result:text
"",=UPPER(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('');
    });
  });

  describe('LOWER', () => {
    it('should convert to lowercase', () => {
      const rcsv = `A:text,Result:text
Hello World,=LOWER(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('hello world');
    });

    it('should handle mixed case', () => {
      const rcsv = `A:text,Result:text
HeLLo WoRLd,=LOWER(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('hello world');
    });

    it('should handle numbers and symbols', () => {
      const rcsv = `A:text,Result:text
HELLO123!,=LOWER(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('hello123!');
    });
  });

  describe('TRIM', () => {
    it('should remove leading and trailing spaces', () => {
      const rcsv = `A:text,Result:text
"  Hello World  ",=TRIM(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Hello World');
    });

    it('should preserve internal spaces', () => {
      const rcsv = `A:text,Result:text
"  Hello   World  ",=TRIM(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Hello   World');
    });

    it('should handle string with only spaces', () => {
      const rcsv = `A:text,Result:text
"   ",=TRIM(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('');
    });

    it('should handle empty string', () => {
      const rcsv = `A:text,Result:text
"",=TRIM(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('');
    });
  });

  describe('FIND', () => {
    it('should find substring (case-sensitive)', () => {
      const rcsv = `A:text,Result:number
Hello World,"=FIND(""World"",A2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(7);
    });

    it('should find substring with start position', () => {
      const rcsv = `A:text,Result:number
Hello Hello,"=FIND(""Hello"",A2,2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(7);
    });

    it('should be case sensitive', () => {
      const rcsv = `A:text,Result:text
Hello World,"=FIND(""world"",A2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('#ERROR!');
    });

    it('should error when substring not found', () => {
      const rcsv = `A:text,Result:text
Hello World,"=FIND(""xyz"",A2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('#ERROR!');
    });

    it('should error with invalid start position', () => {
      const rcsv = `A:text,Result:text
Hello,"=FIND(""H"",A2,0)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('#ERROR!');
    });

    it('should find single character', () => {
      const rcsv = `A:text,Result:number
Hello,"=FIND(""e"",A2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(2);
    });
  });

  describe('SEARCH', () => {
    it('should find substring (case-insensitive)', () => {
      const rcsv = `A:text,Result:number
Hello World,"=SEARCH(""world"",A2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(7);
    });

    it('should find substring with start position', () => {
      const rcsv = `A:text,Result:number
Hello Hello,"=SEARCH(""hello"",A2,2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(7);
    });

    it('should be case insensitive', () => {
      const rcsv = `A:text,Result:number
Hello World,"=SEARCH(""WORLD"",A2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(7);
    });

    it('should error when substring not found', () => {
      const rcsv = `A:text,Result:text
Hello World,"=SEARCH(""xyz"",A2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('#ERROR!');
    });
  });

  describe('REPLACE', () => {
    it('should replace characters at position', () => {
      const rcsv = `A:text,Result:text
Hello World,"=REPLACE(A2,7,5,""Earth"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Hello Earth');
    });

    it('should replace at beginning', () => {
      const rcsv = `A:text,Result:text
Hello World,"=REPLACE(A2,1,5,""Hi"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Hi World');
    });

    it('should replace zero characters (insert)', () => {
      const rcsv = `A:text,Result:text
Hello World,"=REPLACE(A2,6,1,"", "")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Hello, World');
    });

    it('should replace all characters', () => {
      const rcsv = `A:text,Result:text
Hello,"=REPLACE(A2,1,5,""Goodbye"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Goodbye');
    });

    it('should error on invalid start position', () => {
      const rcsv = `A:text,Result:text
Hello,"=REPLACE(A2,0,1,""X"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('#ERROR!');
    });

    it('should error on negative character count', () => {
      const rcsv = `A:text,Result:text
Hello,"=REPLACE(A2,1,-1,""X"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('#ERROR!');
    });
  });

  describe('SUBSTITUTE', () => {
    it('should substitute all occurrences', () => {
      const rcsv = `A:text,Result:text
Hello World Hello,"=SUBSTITUTE(A2,""Hello"",""Hi"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Hi World Hi');
    });

    it('should substitute specific occurrence', () => {
      const rcsv = `A:text,Result:text
Hello World Hello,"=SUBSTITUTE(A2,""Hello"",""Hi"",2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Hello World Hi');
    });

    it('should substitute first occurrence', () => {
      const rcsv = `A:text,Result:text
Hello World Hello,"=SUBSTITUTE(A2,""Hello"",""Hi"",1)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Hi World Hello');
    });

    it('should handle no matches', () => {
      const rcsv = `A:text,Result:text
Hello World,"=SUBSTITUTE(A2,""xyz"",""abc"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Hello World');
    });

    it('should handle empty old text', () => {
      const rcsv = `A:text,Result:text
Hello,"=SUBSTITUTE(A2,"""",""X"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('Hello');
    });

    it('should error on invalid instance number', () => {
      const rcsv = `A:text,Result:text
Hello,"=SUBSTITUTE(A2,""H"",""X"",0)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('#ERROR!');
    });
  });

  describe('REPT', () => {
    it('should repeat text', () => {
      const rcsv = `A:text,Result:text
Hello,"=REPT(A2,3)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('HelloHelloHello');
    });

    it('should repeat single character', () => {
      const rcsv = `Result:text
"=REPT(""*"",5)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][0].value).toBe('*****');
    });

    it('should handle zero repetitions', () => {
      const rcsv = `A:text,Result:text
Hello,"=REPT(A2,0)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('');
    });

    it('should error on negative repetitions', () => {
      const rcsv = `A:text,Result:text
Hello,"=REPT(A2,-1)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('#ERROR!');
    });

    it('should handle empty string', () => {
      const rcsv = `A:text,Result:text
"","=REPT(A2,5)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('');
    });

    it('should error on excessive repetitions', () => {
      const rcsv = `A:text,Result:text
Hello,"=REPT(A2,100000)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('#ERROR!');
    });
  });

  describe('EXACT', () => {
    it('should return true for identical strings', () => {
      const rcsv = `A:text,B:text,Result:text
Hello,Hello,"=EXACT(A2,B2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe(true);
    });

    it('should return false for different strings', () => {
      const rcsv = `A:text,B:text,Result:text
Hello,World,"=EXACT(A2,B2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe(false);
    });

    it('should be case sensitive', () => {
      const rcsv = `A:text,B:text,Result:text
Hello,hello,"=EXACT(A2,B2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe(false);
    });

    it('should handle empty strings', () => {
      const rcsv = `A:text,B:text,Result:text
"","","=EXACT(A2,B2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe(true);
    });

    it('should handle spaces', () => {
      // Test spaces in quoted fields - csv-parse should preserve differences
      const rcsv = `A:text,B:text,Result:text
"Hello ","Hello","=EXACT(A2,B2)"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][2].value).toBe(false);
    });
  });

  describe('CHAR', () => {
    it('should convert ASCII codes to characters', () => {
      const rcsv = `Result:text
=CHAR(65)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][0].value).toBe('A');
    });

    it('should handle lowercase letters', () => {
      const rcsv = `Result:text
=CHAR(97)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][0].value).toBe('a');
    });

    it('should handle numbers', () => {
      const rcsv = `Result:text
=CHAR(48)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][0].value).toBe('0');
    });

    it('should handle space character', () => {
      const rcsv = `Result:text
=CHAR(32)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][0].value).toBe(' ');
    });

    it('should error on invalid ASCII codes', () => {
      const rcsv = `Result:text
=CHAR(0)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][0].value).toBe('#ERROR!');
    });

    it('should error on codes above 255', () => {
      const rcsv = `Result:text
=CHAR(256)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][0].value).toBe('#ERROR!');
    });
  });


  describe('VALUE', () => {
    it('should convert numeric text to number', () => {
      const rcsv = `A:text,Result:number
"123",=VALUE(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(123);
    });

    it('should handle decimal numbers', () => {
      const rcsv = `A:text,Result:number
"123.45",=VALUE(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(123.45);
    });

    it('should handle percentages', () => {
      const rcsv = `A:text,Result:number
"25%",=VALUE(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(0.25);
    });

    it('should handle currency symbols', () => {
      const rcsv = `A:text,Result:number
"$123.45",=VALUE(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(123.45);
    });

    it('should handle numbers with commas', () => {
      const rcsv = `A:text,Result:number
"1,234.56",=VALUE(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(1234.56);
    });

    it('should return 0 for empty string', () => {
      const rcsv = `A:text,Result:number
"",=VALUE(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(0);
    });

    it('should error on non-numeric text', () => {
      const rcsv = `A:text,Result:text
"Hello",=VALUE(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('#ERROR!');
    });

    it('should handle negative numbers', () => {
      const rcsv = `A:text,Result:number
"-123.45",=VALUE(A2)`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe(-123.45);
    });
  });

  describe('TEXT', () => {
    it('should format number with basic format', () => {
      const rcsv = `A:number,Result:text
123,"=TEXT(A2,""0"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('123');
    });

    it('should format with decimal places', () => {
      const rcsv = `A:number,Result:text
123.456,"=TEXT(A2,""0.00"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('123.46');
    });

    it('should format with one decimal place', () => {
      const rcsv = `A:number,Result:text
123.456,"=TEXT(A2,""0.0"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('123.5');
    });

    it('should format with thousands separator', () => {
      const rcsv = `A:number,Result:text
1234.56,"=TEXT(A2,""#,##0.00"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('1,234.56');
    });

    it('should format as percentage', () => {
      const rcsv = `A:number,Result:text
0.25,"=TEXT(A2,""0%"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('25%');
    });

    it('should format as percentage with decimals', () => {
      const rcsv = `A:number,Result:text
0.2567,"=TEXT(A2,""0.00%"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('25.67%');
    });

    it('should handle zero values', () => {
      const rcsv = `A:number,Result:text
0,"=TEXT(A2,""0.00"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('0.00');
    });

    it('should handle negative numbers', () => {
      const rcsv = `A:number,Result:text
-123.45,"=TEXT(A2,""0.00"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('-123.45');
    });

    it('should fallback to simple formatting for unknown formats', () => {
      const rcsv = `A:number,Result:text
123.45,"=TEXT(A2,""unknown"")"`;
      
      const parsed = parseStructure(rcsv);
      const result = calculate(parsed);
      
      expect(result.sheets[0].data[0][1].value).toBe('123.45');
    });
  });
});