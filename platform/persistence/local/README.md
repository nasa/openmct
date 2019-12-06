# Local Storage Plugin
Provides persistence of user-created objects in browser Local Storage. Objects persisted in this way will only be 
available from the browser and machine on which they were persisted. For shared persistence, consider the 
[Elasticsearch](../elastic/) and [CouchDB](../couch/) persistence plugins.

## Installation
```js
openmct.install(openmct.plugins.LocalStorage());
```