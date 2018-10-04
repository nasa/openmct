# Import / Export Plugin
The Import/Export plugin allows objects to be exported as JSON files. This allows for sharing of objects between users 
who are not using a shared persistence store. It also allows object trees to be backed up. Additionally, object trees 
exported using this tool can then be exposed as read-only static root trees using the 
[Static Root Plugin](../../src/plugins/staticRootPlugin/README.md).

Upon installation it will add two new context menu actions to allow import and export of objects. Initiating the Export 
action on an object will produce a JSON file that includes the object and all of its composed children. Selecting Import 
on an object will allow the user to import a previously exported object tree as a child of the selected object.

## Installation
```js
openmct.install(openmct.plugins.ImportExport())
```