# eslint-plugin-prefer-arrow
ESLint plugin to prefer arrow functions. By default, the plugin allows usage of `function` as a member of an Object's prototype, but this can be changed with the property `disallowPrototype`. Alternatively, with the `singleReturnOnly` option, this plugin only reports functions where converting to an arrow function would dramatically simplify the code.

# Installation

Install the npm package
```bash
# If eslint is installed globally
npm install -g eslint-plugin-prefer-arrow

# If eslint is installed locally
npm install -D eslint-plugin-prefer-arrow
```

Add the plugin to the `plugins` section and the rule to the `rules` section in your .eslintrc
```js
"plugins": [
  "prefer-arrow"
],
"rules": [
  "prefer-arrow/prefer-arrow-functions": [
     "warn",
     {
       "disallowPrototype": true,
       "singleReturnOnly": false
     }
   ]
]
```
# Configuration
 * `disallowPrototype`: If set to true, the plugin will warn if `function` is used anytime. Otherwise, the plugin allows usage of `function` if it is a member of an Object's prototype.
 * `singleReturnOnly`: If set to true, the plugin will only warn for `function` declarations which *only* contain a return statement. These often look much better when declared as arrow functions without braces. Works well in conjunction with ESLint's built-in [arrow-body-style](http://eslint.org/docs/rules/arrow-body-style) set to `as-needed`.
 
