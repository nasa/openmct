#!/usr/bin/env node

/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
const http = require('http');
const process = require('process');

const ANNOTATION_TYPES = Object.freeze({
  NOTEBOOK: 'NOTEBOOK',
  GEOSPATIAL: 'GEOSPATIAL',
  PIXEL_SPATIAL: 'PIXEL_SPATIAL',
  TEMPORAL: 'TEMPORAL',
  PLOT_SPATIAL: 'PLOT_SPATIAL'
});

const args = process.argv.slice(2);
let annotationType;
let serverUrl;
let databaseName = 'openmct'; // default db name to "openmct"

args.forEach((val, index) => {
  switch (val) {
    case '--help':
      console.log(
        'Usage: deleteAnnotations.js [--annotationType type] [--dbName name] <CouchDB URL> \n'
      );
      console.log('Annotation types: ', Object.keys(ANNOTATION_TYPES).join(', '));
      process.exit(0);
      break;
    case '--annotationType':
      annotationType = args[index + 1];
      if (!Object.values(ANNOTATION_TYPES).includes(annotationType)) {
        console.log('Invalid annotation type!');
        console.log('Valid annotation types: ', Object.keys(ANNOTATION_TYPES).join(', '));
        process.exit(1);
      }
      break;
    case '--dbName':
      databaseName = args[index + 1];
      break;
    default:
      if (!serverUrl && val.startsWith('http')) {
        serverUrl = new URL(val);
      }
      break;
  }
});

// If no serverUrl is provided, default CouchDB URL "http://localhost:5984" is used
if (!serverUrl) {
  serverUrl = new URL('http://127.0.0.1:5984');
}

const options = {
  hostname: serverUrl.hostname,
  port: serverUrl.port || 5984,
  path: `/${databaseName}/_all_docs?include_docs=true`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

http.request(options, handleResponse).on('error', handleError).end();

function handleError(e) {
  console.log(`Problem with request: ${e.message}`);
}

function handleResponse(res) {
  let output = '';

  res.setEncoding('utf8');
  res.on('data', (chunk) => (output += chunk));
  res.on('end', () => processEndResponse(output));
}

function processEndResponse(output) {
  try {
    const obj = JSON.parse(output);
    const docsToDelete = obj?.rows?.filter((row) => shouldDeleteDoc(row.doc));

    if (docsToDelete?.length) {
      performBulkDelete(docsToDelete);
    } else {
      console.log('No documents found to delete.');
    }
  } catch (e) {
    console.error('An error occurred:', e.message);
  }
}

function shouldDeleteDoc(doc) {
  return (
    !doc._deleted &&
    doc.model &&
    doc.model.type === 'annotation' &&
    (!annotationType || doc.model.annotationType === annotationType)
  );
}

function performBulkDelete(docsToDelete) {
  docsToDelete.forEach((doc) => (doc._deleted = true));

  const deleteOptions = {
    hostname: serverUrl.hostname,
    port: serverUrl.port || 5984,
    path: '/database/_bulk_docs',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const deleteReq = http.request(deleteOptions).on('error', handleError);
  deleteReq.write(JSON.stringify({ docs: docsToDelete }));
  deleteReq.end();
  console.log(`Deleted ${docsToDelete.length} document${docsToDelete.length === 1 ? '' : 's'}.`);
}
