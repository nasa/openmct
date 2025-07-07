# My Items plugin
Defines top-level folder named "My Items" to store user-created items. Enabled by default, this can be disabled in a read-only deployment with no user-editable objects.

## Installation
```js
openmct.install(openmct.plugins.MyItems());
```

## Options
When installing, the plugin can take several options:

- `name`: The label of the root object. Defaults to "My Items"
  - Example: `'Apple Items'`

- `namespace`: The namespace to create the root object in. Defaults to the empty string `''`
  - Example: `'apple-namespace'`

- `priority`: The optional priority to install this plugin. Defaults to `openmct.priority.LOW`
  - Example: `'openmct.priority.LOW'`

E.g., to install with a custom name and namespace, you could use:


```js
openmct.install(openmct.plugins.MyItems('Apple Items', 'apple-namespace'));
```