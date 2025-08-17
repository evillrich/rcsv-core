// RCSV Formula Grammar for Peggy
// Supports: numbers, cell references, ranges, SUM function, basic math operators, cross-sheet references

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
  = "=" expr:Expression { return expr; }

Expression
  = AdditionExpression

AdditionExpression
  = left:MultiplicationExpression tail:(("+" / "-") MultiplicationExpression)* {
    return tail.reduce((result, element) => {
      return createNode('binary', {
        op: element[0],
        left: result,
        right: element[1]
      });
    }, left);
  }

MultiplicationExpression
  = left:PowerExpression tail:(("*" / "/") PowerExpression)* {
    return tail.reduce((result, element) => {
      return createNode('binary', {
        op: element[0],
        left: result,
        right: element[1]
      });
    }, left);
  }

PowerExpression
  = left:UnaryExpression tail:("^" UnaryExpression)* {
    return tail.reduce((result, element) => {
      return createNode('binary', {
        op: element[0],
        left: result,
        right: element[1]
      });
    }, left);
  }

UnaryExpression
  = op:("+" / "-") operand:UnaryExpression {
    return createNode('unary', { op, operand });
  }
  / PrimaryExpression

PrimaryExpression
  = FunctionCall
  / SheetReference
  / Range
  / CellReference
  / Number
  / "(" expr:Expression ")" { return expr; }

FunctionCall
  = name:FunctionName "(" args:ArgumentList? ")" {
    return createNode('function', {
      name: name.toUpperCase(),
      args: args || []
    });
  }

FunctionName
  = "SUM"i
  / "AVERAGE"i
  / "COUNT"i
  / "MIN"i
  / "MAX"i
  / "ABS"i
  / "ROUND"i
  / "COUNTA"i

ArgumentList
  = first:Expression rest:("," Expression)* {
    return [first].concat(rest.map(r => r[1]));
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