#!/bin/bash -e

sed -i'.bak' -e 's/LocalStorage()/CouchDB(\{url: "http:\/\/localhost:5984\/openmct", useDesignDocuments: true\})/g' index.html
