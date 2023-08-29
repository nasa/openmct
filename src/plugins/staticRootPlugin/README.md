# Static Root Plugin

This plugin takes an object tree as JSON and exposes it as a non-editable root level tree. This can be useful if you 
have static non-editable content that you wish to expose, such as a standard set of displays that should not be edited 
(but which can be copied and then modified if desired).

Any object tree in Open MCT can be exported as JSON after installing the 
[Import/Export plugin](../../../platform/import-export/README.md).

## Installation
``` js
openmct.install(openmct.plugins.StaticRootPlugin({ namespace: 'mission', exportUrl: 'data/static-objects.json' }));
```

## Parameters
The StaticRootPlugin takes two parameters:
1. __namespace__: This should be a name that uniquely identifies this collection of objects.
2. __exportUrl__: The file that the static tree should be exposed from. This will need to be a path that is reachable by a web 
browser, ie not a path on the local file system.