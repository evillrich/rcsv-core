import { parseFormula as peggyParseFormula, SyntaxError } from './formula';

/**
 * User-friendly wrapper around the generated Peggy formula parser
 * Translates technical Peggy error messages into readable error messages
 */
export function parseFormula(input: string) {
  try {
    return peggyParseFormula(input);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(translateErrorMessage(error, input));
    }
    throw error;
  }
}

/**
 * Translate Peggy error messages into user-friendly messages
 */
function translateErrorMessage(error: SyntaxError, input: string): string {
  const message = error.message;
  const location = error.location;
  
  // Rule 1: Formula must start with =
  if (message.includes('Expected "=" but') && location?.start.offset === 0) {
    return 'Formula must start with =';
  }
  
  // Rule 2: Missing closing parenthesis
  if (message.includes('but end of input found') && input.includes('(')) {
    // Check if we're in a function context
    const beforeError = input.slice(0, location?.start.offset);
    const openParens = (beforeError.match(/\(/g) || []).length;
    const closeParens = (beforeError.match(/\)/g) || []).length;
    
    if (openParens > closeParens) {
      // Check if we're in a function call
      const functionMatch = beforeError.match(/[A-Z]+\s*\((?:[^)]*(?:\([^)]*\))?)*$/i);
      if (functionMatch) {
        return 'Expected ) after function arguments';
      } else {
        return 'Expected ) after expression';
      }
    }
  }
  
  // Rule 3: Unclosed function parenthesis specifically
  if (message.includes('Expected') && message.includes('")"') && input.match(/[A-Z]+\s*\([^)]*$/i)) {
    return 'Expected ) after function arguments';
  }
  
  // Rule 4: General syntax errors - provide helpful context
  if (message.includes('but end of input found')) {
    return 'Unexpected end of formula';
  }
  
  if (message.includes('Expected') && location) {
    const position = location.start.offset;
    const char = input[position] || 'end of input';
    return `Unexpected character '${char}' at position ${position + 1}`;
  }
  
  // Fallback to original message for unknown cases
  return message;
}

// Re-export the SyntaxError for consistency
export { SyntaxError };