#!/bin/bash -e

sed -i'.bak' -e 's/LocalStorage()/CouchDB("http:\/\/localhost:5984\/openmct")/g' index.html
