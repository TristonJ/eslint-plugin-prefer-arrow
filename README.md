# eslint-plugin-prefer-arrow
ESLint plugin to prefer arrow functions. By default, the plugin allows usage of `function` as a member of an Object's prototype.

The purpose of this plugin is to encourage cleaner code by using arrow functions, keeping scope and usage of `this` very clear. 

# Installation

Install the npm package
```bash
# If npm is installed globally
npm install -g eslint-plugin-prefer-arrow

# If npm is installed locally
npm install -d eslint-plugin-prefer-arrow
```

Add the plugin to the `plugins` section in your .eslintrc
```js
"plugins": [
  "prefer-arrow"
],
"rules": [
  "prefer-arrow/prefer-arrow-functions": [
     "warn",
     {
       "disallowPrototype": true
     }
   ]
]
```
# Configuration
There is currently only one configuration option, `disallowPrototype`. If set to true, the plugin will warn if `function` is used anytime. Otherwise, the plugin allows usage of `function` if it is a member of an Object's prototype.
