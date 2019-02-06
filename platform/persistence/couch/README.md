# Couch DB Persistence Plugin
An adapter for using CouchDB for persistence of user-created objects. The plugin installation function takes the URL 
for the CouchDB database as a parameter.

## Installation
```js
openmct.install(openmct.plugins.CouchDB('http://localhost:5984/openmct'))
```