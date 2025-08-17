// RCSV Formula Grammar for Peggy
// Supports: numbers, cell references, ranges, SUM function, basic math operators

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
  
  // Helper to create range references
  function createRange(start, end) {
    return createNode('range', { start, end });
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

ArgumentList
  = first:Expression rest:("," Expression)* {
    return [first].concat(rest.map(r => r[1]));
  }

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