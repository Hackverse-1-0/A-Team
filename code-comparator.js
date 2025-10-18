// code-comparator.js
import * as esprima from 'esprima';
import estraverse from 'estraverse';
import levenshtein from 'fast-levenshtein';

// Normalizes the AST by replacing all unique names
function normalizeAST(ast) {
  return estraverse.replace(ast, {
    enter: function (node) {
      if (node.type === 'Identifier') {
        node.name = '_IDENTIFIER_';
      }
      if (node.type === 'Literal') {
        node.value = '_LITERAL_';
        node.raw = '_LITERAL_';
      }
    },
  });
}

// Main function we'll call from our server
export function compareCode(code1, code2) {
  let ast1, ast2;

  try {
    ast1 = esprima.parseScript(code1);
    ast2 = esprima.parseScript(code2);
  } catch (e) {
    // Return an error if syntax is bad
    return { error: 'Invalid JavaScript syntax in one of the inputs.' };
  }

  const normalizedAst1 = normalizeAST(ast1);
  const normalizedAst2 = normalizeAST(ast2);

  const astString1 = JSON.stringify(normalizedAst1);
  const astString2 = JSON.stringify(normalizedAst2);

  const distance = levenshtein.get(astString1, astString2);

  const maxLength = Math.max(astString1.length, astString2.length);
  const similarity = (1 - distance / maxLength) * 100;
  
  return { similarityPercent: similarity.toFixed(2) };
}