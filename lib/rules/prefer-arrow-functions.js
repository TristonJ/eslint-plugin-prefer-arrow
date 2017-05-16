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
      return context.report(node, 'Prefer using arrow functions over plain functions which only return a value');
  } else if(disallowPrototype || !isPrototypeAssignment(node)) {
    return context.report(node, isNamed(node) ?
      'Use const or class constructors instead of named functions' :
      'Prefer using arrow functions over plain functions');
  }
}
