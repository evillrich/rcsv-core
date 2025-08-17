const { parseStructure, calculate } = require('./dist/core.js');

const simpleRcsv = `Category:text,Budget:currency,Total:currency
Housing,2000,=B2*2
Food,800,=B3*2`;

console.log('=== SIMPLE TEST ===');
try {
  const doc = parseStructure(simpleRcsv);
  console.log('Simple data:');
  doc.sheets[0].data.forEach((row, i) => {
    console.log(`Row ${i+1} (spreadsheet row ${i+2}):`, row.map((cell, j) => {
      const cellRef = String.fromCharCode(65+j) + (i+2);
      return `${cellRef}:${cell.value || cell.formula}`;
    }));
  });
  
  const calculated = calculate(doc);
  console.log('After calculation:');
  calculated.sheets[0].data.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell.formula) {
        const cellRef = String.fromCharCode(65+j) + (i+2);
        console.log(`Cell ${cellRef}: ${cell.formula} -> ${cell.value} (error: ${cell.error || 'none'})`);
      }
    });
  });
} catch (error) {
  console.error('Simple test error:', error.message);
}

console.log('\\n=== COMPLEX TEST ===');
const rcsv = `## Chart: type=bar, title="Budget Overview", x=Category, y=Budget
Category:text,Budget:currency,Actual:currency,Total:currency
Housing,2000,1950,=B2+C2
Food,800,850,=B3+C3
Transport,400,425,=B4+C4
Total,"=SUM(B2:B4)","=SUM(C2:C4)","=SUM(D2:D4)"`;

console.log('Data structure:');
const doc = parseStructure(rcsv);
doc.sheets[0].data.forEach((row, i) => {
  console.log(`Row ${i+1} (spreadsheet row ${i+2}):`, row.map((cell, j) => {
    const cellRef = String.fromCharCode(65+j) + (i+2);
    return `${cellRef}:${cell.value || cell.formula}`;
  }));
});

try {
  const doc = parseStructure(rcsv);
  console.log('Parsed formulas:');
  doc.sheets[0].data.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell.formula) {
        console.log(`Cell ${String.fromCharCode(65+j)}${i+1}: ${cell.formula} -> ${cell.value}`);
      }
    });
  });
  
  const calculated = calculate(doc);
  console.log('\nAfter calculation:');
  calculated.sheets[0].data.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell.formula) {
        console.log(`Cell ${String.fromCharCode(65+j)}${i+1}: ${cell.formula} -> ${cell.value} (error: ${cell.error || 'none'})`);
      }
    });
  });
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}