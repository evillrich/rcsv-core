#!/usr/bin/env node

/**
 * Post-process the generated Peggy parser to add the parseFormula export
 * This script is automatically run after peggy generation
 */

const fs = require('fs');
const path = require('path');

const PARSER_FILE = path.join(__dirname, '..', 'src', 'core', 'parser', 'formula.ts');

function fixParserExports() {
  console.log('🔧 Fixing parser exports...');
  
  if (!fs.existsSync(PARSER_FILE)) {
    console.error(`❌ Parser file not found: ${PARSER_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(PARSER_FILE, 'utf8');
  
  // Check if parseFormula export already exists
  if (content.includes('peg$parse as parseFormula')) {
    console.log('✅ parseFormula export already exists');
    return;
  }
  
  // Look for the export block and add parseFormula
  const exportMatch = content.match(/(export\s*\{[^}]*)(peg\$parse\s+as\s+parse)([^}]*\})/);
  
  if (!exportMatch) {
    console.error('❌ Could not find export block to modify');
    process.exit(1);
  }
  
  // Replace the export block to include parseFormula
  const newExportBlock = `${exportMatch[1]}${exportMatch[2]},\n  peg$parse as parseFormula${exportMatch[3]}`;
  
  content = content.replace(exportMatch[0], newExportBlock);
  
  fs.writeFileSync(PARSER_FILE, content);
  console.log('✅ Added parseFormula export to generated parser');
}

if (require.main === module) {
  fixParserExports();
}

module.exports = { fixParserExports };