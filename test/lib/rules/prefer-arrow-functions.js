/**
 * @fileoverview Tests for prefer-arrow-functions rule.
 * @author Triston Jones
 */

'use strict';

const singleReturnOnly = code => ({code, options: [{singleReturnOnly: true}]});

var rule = require('../../../lib/rules/prefer-arrow-functions'),
    RuleTester = require('eslint').RuleTester;

var tester = new RuleTester({parserOptions: {ecmaVersion: 6}});
tester.run('lib/rules/prefer-arrow-functions', rule, {
  parserOptions: {ecmaVersion: 6},
  valid: [
    'var foo = (bar) => bar;',
    'var foo = bar => bar;',
    'var foo = bar => { return bar; }',
    'var foo = () => 1;',
    'var foo = (bar, fuzz) => bar + fuzz',
    '["Hello", "World"].reduce((p, a) => p + " " + a);',
    'var foo = (...args) => args',
    'class obj {constructor(foo){this.foo = foo;}}; obj.prototype.func = function() {};',
    'class obj {constructor(foo){this.foo = foo;}}; obj.prototype = {func: function() {}};',
    ...[
        'var foo = (bar) => {return bar();}',
        'function foo(bar) {bar()}',
        'var x = function foo(bar) {bar()}',
        'var x = function(bar) {bar()}',
        'function foo(bar) {/* yo */ bar()}',
        'function foo() {}',
        'function foo(bar) {bar(); return bar()}',
    ].map(singleReturnOnly)
  ],
  invalid: [
    {code: 'function foo() { return "Hello!"; }', errors: ['Use const or class constructors instead of named functions']},
    {code: 'function foo() { return arguments; }', errors: ['Use const or class constructors instead of named functions']},
    {code: 'var foo = function() { return "World"; }', errors: ['Prefer using arrow functions over plain functions']},
    {code: '["Hello", "World"].reduce(function(a, b) { return a + " " + b; })', errors: ['Prefer using arrow functions over plain functions']},
    {code: 'class obj {constructor(foo){this.foo = foo;}}; obj.prototype.func = function() {};', errors: ['Prefer using arrow functions over plain functions'], options: [{disallowPrototype:true}]},
    ...[
        'function foo() { return 3; }',
        'function foo(a) { return 3; }',
        'var foo = function() { return "World"; }',
        'var foo = function x() { return "World"; }',
        'function foo(a) { /* yo */ return 3; }',
        'function foo(a) { return a && (3 + a()) ? true : 99; }',
    ].map(singleReturnOnly).map(testCase => Object.assign({errors: ['Prefer using arrow functions over plain functions which only return a value']}, testCase))
  ]
});
