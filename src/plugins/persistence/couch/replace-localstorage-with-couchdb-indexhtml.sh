#!/bin/bash -e

sed -i'.bak' -e 's/LocalStorage()/CouchDB("http:\/\/0.0.0.0:5984\/openmct")/g' index.html
