/**
 * @fileoverview Rule to prefer arrow functions over plain functions
 * @author Triston Jones
 */

'use strict';

module.exports = {
  meta: {
    docs: {
      description: 'prefer arrow functions',
      category: 'emcascript6',
      recommended: false
    },
    fixable: 'code',
    schema: [{
      type: 'object',
      properties: {
        disallowPrototype: {
          type: 'boolean'
        },
        singleReturnOnly: {
          type: 'boolean'
        }
      },
      additionalProperties: false
    }]
  },
  create: function(context) {
    return {
      'FunctionDeclaration:exit': (node) => inspectNode(node, context),
      'FunctionExpression:exit': (node) => inspectNode(node, context)
    };
  }
}

const isPrototypeAssignment = (node) => {
  let parent = node.parent;

  while(parent) {
    switch(parent.type) {
      case 'MemberExpression':
        if(parent.property && parent.property.name === 'prototype')
          return true;
        parent = parent.object;
        break;
      case 'AssignmentExpression':
        parent = parent.left;
        break;
      case 'Property':
      case 'ObjectExpression':
        parent = parent.parent;
        break;
      default:
        return false;
    }
  }

  return false;
}

const isConstructor = (node) => {
  let parent = node.parent;
  return parent && parent.kind === 'constructor';
}

const isNamed = (node) =>
  node.type === 'FunctionDeclaration' && node.id && node.id.name;

const inspectNode = (node, context) => {
  const opts = context.options[0] || {};
  const disallowPrototype = opts.disallowPrototype;
  const singleReturnOnly = opts.singleReturnOnly;

  if(isConstructor(node)) return;
  if (singleReturnOnly) {
    if (node.body.body.length === 1 && node.body.body[0].type === 'ReturnStatement')
      return context.report({
        node,
        message: 'Prefer using arrow functions over plain functions which only return a value',
        fix(fixer) {
          let result;
          const src = context.getSourceCode();

          if (node.type === 'FunctionDeclaration') {
            result = fixer.replaceText(node, fixFunctionDeclaration(src, node));

          } else if (node.type === 'FunctionExpression') {
            result = fixer.replaceText(node, fixFunctionExpression(src, node));
          }
          return result;
        }
      });
  } else if(disallowPrototype || !isPrototypeAssignment(node)) {
    return context.report(node, isNamed(node) ?
        'Use const or class constructors instead of named functions' :
        'Prefer using arrow functions over plain functions');
  }
}

let replaceTokens = function (origSource, tokens, replacements) {
  let removeNextLeadingSpace = false;
  let result = '';
  let lastTokenEnd = -1;
  for (const token of tokens) {
    if (lastTokenEnd >= 0) {
      let between = origSource.substring(lastTokenEnd, token.start);
      if (removeNextLeadingSpace && between[0] === ' ') {
        between = between.substring(1);
      }
      result += between;
    }
    removeNextLeadingSpace = false;
    if (token.start in replacements) {
      const replaceInfo = replacements[token.start];
      result += replaceInfo[0];
      if (replaceInfo[1]) {
        removeNextLeadingSpace = true;
      }
    } else {
      result += origSource.substring(token.start, token.end);
    }
    lastTokenEnd = token.end;
  }
  return result;
};

function fixFunctionExpression(src, node) {
  const orig = src.getText();
  const tokens = src.getTokens(node);
  let replacements = {};
  const functionKeywordToken = tokens.find(token => token.type === 'Keyword' && token.value === 'function');
  replacements[functionKeywordToken.start] = ['', true];
  const tokenAfterFunctionKeyword = src.getTokenAfter(functionKeywordToken);
  if (tokenAfterFunctionKeyword.type === 'Identifier') {
    replacements[tokenAfterFunctionKeyword.start] = [`/*${tokenAfterFunctionKeyword.value}*/`];
  }
  replacements[src.getTokens(node.body).find(token => token.type === 'Punctuator' && token.value === '{').start] = ['=>'];
  replacements[src.getTokens(node.body).find(token => token.type === 'Keyword' && token.value === 'return').start] = ['', true];
  const semicolonsInReturn = src.getTokens(node.body).filter(token => token.type === 'Punctuator' && token.value === ';');
  if (semicolonsInReturn.length) {
    replacements[semicolonsInReturn[semicolonsInReturn.length - 1].start] = ['', true];
  }
  const closeBraces = src.getTokens(node.body).filter(token => token.type === 'Punctuator' && token.value === '}');
  replacements[closeBraces[closeBraces.length - 1].start] = [''];
  let newtext = replaceTokens(orig, tokens, replacements);
  newtext = newtext.replace(/ $/, '');
  return newtext;
}

function fixFunctionDeclaration(src, node) {
  const orig = src.getText();
  const tokens = src.getTokens(node);
  let replacements = {};
  replacements[tokens.find(token => token.type === 'Keyword' && token.value === 'function').start] = ['const'];
  replacements[tokens.find(token => token.type === 'Punctuator' && token.value === '(').start] = [' = ('];
  replacements[src.getTokens(node.body).find(token => token.type === 'Punctuator' && token.value === '{').start] = ['=>'];
  replacements[src.getTokens(node.body).find(token => token.type === 'Keyword' && token.value === 'return').start] = ['', true];
  const semicolonsInReturn = src.getTokens(node.body).filter(token => token.type === 'Punctuator' && token.value === ';');
  if (semicolonsInReturn.length) {
    replacements[semicolonsInReturn[semicolonsInReturn.length-1].start] = ['', true];
  }
  const closeBraces = src.getTokens(node.body).filter(token => token.type === 'Punctuator' && token.value === '}');
  replacements[closeBraces[closeBraces.length-1].start] = [''];
  let newtext = replaceTokens(orig, tokens, replacements);
  newtext = newtext.replace(/ $/, '');
  newtext += ';';
  return newtext;
}
