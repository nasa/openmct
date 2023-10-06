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
const process = require('process');

async function main() {
  try {
    const { annotationType, serverUrl, databaseName, helpRequested, username, password } =
      processArguments();
    if (helpRequested) {
      return;
    }
    const docsToDelete = await gatherDocumentsForDeletion({
      serverUrl,
      databaseName,
      annotationType,
      username,
      password
    });
    const deletedDocumentCount = await performBulkDelete({
      docsToDelete,
      serverUrl,
      databaseName,
      username,
      password
    });
    console.log(
      `Deleted ${deletedDocumentCount} document${deletedDocumentCount === 1 ? '' : 's'}.`
    );
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

const ANNOTATION_TYPES = Object.freeze({
  NOTEBOOK: 'NOTEBOOK',
  GEOSPATIAL: 'GEOSPATIAL',
  PIXEL_SPATIAL: 'PIXEL_SPATIAL',
  TEMPORAL: 'TEMPORAL',
  PLOT_SPATIAL: 'PLOT_SPATIAL'
});

function processArguments() {
  const args = process.argv.slice(2);
  let annotationType;
  let databaseName = 'openmct'; // default db name to "openmct"
  let serverUrl = new URL('http://127.0.0.1:5984'); // default db name to "openmct"
  let helpRequested = false;

  args.forEach((val, index) => {
    switch (val) {
      case '--help':
        console.log(
          'Usage: deleteAnnotations.js [--annotationType type] [--dbName name] <CouchDB URL> \nFor authentication, set the environment variables COUCHDB_USERNAME and COUCHDB_PASSWORD. \n'
        );
        console.log('Annotation types: ', Object.keys(ANNOTATION_TYPES).join(', '));
        helpRequested = true;
        break;
      case '--annotationType':
        annotationType = args[index + 1];
        if (!Object.values(ANNOTATION_TYPES).includes(annotationType)) {
          throw new Error(`Invalid annotation type: ${annotationType}`);
        }
        break;
      case '--dbName':
        databaseName = args[index + 1];
        break;
      case '--serverUrl':
        serverUrl = new URL(args[index + 1]);
        break;
    }
  });

  let username = process.env.COUCHDB_USERNAME || '';
  let password = process.env.COUCHDB_PASSWORD || '';

  return {
    annotationType,
    serverUrl,
    databaseName,
    helpRequested,
    username,
    password
  };
}

async function gatherDocumentsForDeletion({
  serverUrl,
  databaseName,
  annotationType,
  username,
  password
}) {
  const baseUrl = `${serverUrl.href}${databaseName}/_find`;
  let bookmark = null;
  let docsToDelete = [];
  let hasMoreDocs = true;

  const body = {
    selector: {
      _id: { $gt: null },
      'model.type': 'annotation'
    },
    fields: ['_id', '_rev'],
    limit: 1000
  };

  if (annotationType !== undefined) {
    body.selector['model.annotationType'] = annotationType;
  }

  const findOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };

  if (username && password) {
    findOptions.headers.Authorization = `Basic ${btoa(`${username}:${password}`)}`;
  }

  while (hasMoreDocs) {
    if (bookmark) {
      body.bookmark = bookmark;
    }

    const res = await fetch(baseUrl, findOptions);

    if (!res.ok) {
      throw new Error(`Server responded with status: ${res.status}`);
    }

    const findResult = await res.json();

    bookmark = findResult.bookmark;
    docsToDelete = [...docsToDelete, ...findResult.docs];

    // check if we got less than limit, set hasMoreDocs to false
    hasMoreDocs = findResult.docs.length === body.limit;
  }

  return docsToDelete;
}

async function performBulkDelete({ docsToDelete, serverUrl, databaseName, username, password }) {
  docsToDelete.forEach((doc) => (doc._deleted = true));

  const deleteOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ docs: docsToDelete })
  };

  if (username && password) {
    deleteOptions.headers.Authorization = `Basic ${btoa(`${username}:${password}`)}`;
  }

  const response = await fetch(`${serverUrl.href}${databaseName}/_bulk_docs`, deleteOptions);
  if (!response.ok) {
    throw new Error('Failed with status code: ' + response.status);
  }

  return docsToDelete.length;
}

main();
