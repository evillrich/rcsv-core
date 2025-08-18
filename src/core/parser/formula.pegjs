// RCSV Formula Grammar for Peggy
// Supports: numbers, cell references, ranges, SUM function, basic math operators, cross-sheet references
//
// BUILD INSTRUCTIONS:
// This file is the source grammar that generates src/core/parser/formula.ts
// To regenerate the parser after modifying this grammar:
//   npm run build:parser
// 
// The build process automatically:
// 1. Runs peggy to generate the TypeScript parser
// 2. Adds the required `parseFormula` export (via scripts/fix-parser-exports.js)
//
// MANUAL BUILD (if needed):
//   npx peggy --allowed-start-rules Formula --format es --output src/core/parser/formula.ts src/core/parser/formula.pegjs
//   node scripts/fix-parser-exports.js

{
  // Helper function to create AST nodes
  function createNode(type, props) {
    return { type, ...props };
  }
  
  // Helper to parse cell references like A1, B2
  function parseCellRef(ref) {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) throw new Error(`Invalid cell reference: ${ref}`);
    return createNode('cell', { ref });
  }
  
  // Helper to parse sheet-qualified cell references like Sheet1!A1
  function parseSheetCellRef(sheet, ref) {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) throw new Error(`Invalid cell reference: ${ref}`);
    return createNode('sheet_cell', { sheet, ref });
  }
  
  // Helper to create range references
  function createRange(start, end) {
    return createNode('range', { start, end });
  }
  
  // Helper to create sheet-qualified range references
  function createSheetRange(sheet, start, end) {
    return createNode('sheet_range', { sheet, start, end });
  }
}

// Main entry point
Formula
  = "=" _ expr:Expression _ { return expr; }

Expression
  = AdditionExpression

AdditionExpression
  = left:MultiplicationExpression tail:(_ ("+" / "-") _ MultiplicationExpression)* {
    return tail.reduce((result, element) => {
      return createNode('binary', {
        op: element[1],
        left: result,
        right: element[3]
      });
    }, left);
  }

MultiplicationExpression
  = left:PowerExpression tail:(_ ("*" / "/") _ PowerExpression)* {
    return tail.reduce((result, element) => {
      return createNode('binary', {
        op: element[1],
        left: result,
        right: element[3]
      });
    }, left);
  }

PowerExpression
  = left:UnaryExpression tail:(_ "^" _ UnaryExpression)* {
    return tail.reduce((result, element) => {
      return createNode('binary', {
        op: element[1],
        left: result,
        right: element[3]
      });
    }, left);
  }

UnaryExpression
  = op:("+" / "-") _ operand:UnaryExpression {
    return createNode('unary', { op, operand });
  }
  / PrimaryExpression

PrimaryExpression
  = FunctionCall
  / SheetReference
  / Range
  / CellReference
  / Number
  / "(" _ expr:Expression _ ")" { return expr; }

FunctionCall
  = name:FunctionName _ "(" _ args:ArgumentList? _ ")" {
    return createNode('function', {
      name: name.toUpperCase(),
      args: args || []
    });
  }

FunctionName
  = name:$([A-Za-z][A-Za-z0-9_]*) { 
    return name.toUpperCase();
  }

ArgumentList
  = first:Expression rest:(_ "," _ Expression)* {
    return [first].concat(rest.map(r => r[3]));
  }

SheetReference
  = sheet:SheetName "!" range:Range {
    return createSheetRange(sheet, range.start, range.end);
  }
  / sheet:SheetName "!" ref:$([A-Z]+ [0-9]+) {
    return parseSheetCellRef(sheet, ref);
  }

SheetName
  = "'" name:$([^']+) "'" { return name.replace(/''/g, "'"); }
  / name:$([A-Za-z_][A-Za-z0-9_]*) { return name; }

Range
  = start:CellReference ":" end:CellReference {
    return createRange(start.ref, end.ref);
  }

CellReference
  = ref:$([A-Z]+ [0-9]+) {
    return parseCellRef(ref);
  }

Number
  = value:$([-]? [0-9]+ ("." [0-9]+)?) {
    return createNode('number', { value: parseFloat(value) });
  }

// Whitespace handling
_ "whitespace"
  = [ \t\n\r]*