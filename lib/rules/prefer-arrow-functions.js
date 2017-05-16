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

const tokenMatcher = (type, value) =>
  token => token.type === type && token.value === value;

function fixFunctionExpression(src, node) {
  const orig = src.getText();
  const tokens = src.getTokens(node);
  const bodyTokens = src.getTokens(node.body);

  let swap = {};
  const functionKeywordToken = tokens.find(tokenMatcher('Keyword', 'function'));
  swap[functionKeywordToken.start] = ['', true];
  const nameToken = src.getTokenAfter(functionKeywordToken);
  if (nameToken.type === 'Identifier') {
    swap[nameToken.start] = [`/*${nameToken.value}*/`];
  }
  swap[bodyTokens.find(tokenMatcher('Punctuator', '{')).start] = ['=>'];
  swap[bodyTokens.find(tokenMatcher('Keyword', 'return')).start] = ['', true];
  const semicolons = bodyTokens.filter(tokenMatcher('Punctuator', ';'));
  if (semicolons.length) {
    swap[semicolons[semicolons.length - 1].start] = ['', true];
  }
  const closeBraces = bodyTokens.filter(tokenMatcher('Punctuator', '}'));
  swap[closeBraces[closeBraces.length - 1].start] = [''];
  return replaceTokens(orig, tokens, swap).replace(/ $/, '');
}

function fixFunctionDeclaration(src, node) {
  const orig = src.getText();
  const tokens = src.getTokens(node);
  const bodyTokens = src.getTokens(node.body);
  let swap = {};
  swap[tokens.find(tokenMatcher('Keyword', 'function')).start] = ['const'];
  swap[tokens.find(tokenMatcher('Punctuator', '(')).start] = [' = ('];
  swap[bodyTokens.find(tokenMatcher('Punctuator', '{')).start] = ['=>'];
  swap[bodyTokens.find(tokenMatcher('Keyword', 'return')).start] = ['', true];
  const semicolonsInReturn = bodyTokens.filter(tokenMatcher('Punctuator', ';'));
  if (semicolonsInReturn.length) {
    swap[semicolonsInReturn[semicolonsInReturn.length-1].start] = ['', true];
  }
  const closeBraces = bodyTokens.filter(tokenMatcher('Punctuator', '}'));
  swap[closeBraces[closeBraces.length-1].start] = [''];
  return replaceTokens(orig, tokens, swap).replace(/ $/, '') + ';';
}
