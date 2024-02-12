#!/usr/bin/env node

/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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
    const { serverUrl, databaseName, helpRequested, username, password, backupFilename } =
      processArguments();
    if (helpRequested) {
      return;
    }
    const restoredDocumentCount = await performUpsert({
      backupFilename,
      serverUrl,
      databaseName,
      username,
      password
    });
    console.log(
      `Restored ${restoredDocumentCount} document${restoredDocumentCount === 1 ? '' : 's'}.`
    );
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

function processArguments() {
  const args = process.argv.slice(2);
  let databaseName = 'openmct'; // default db name to "openmct"
  let serverUrl = new URL('http://127.0.0.1:5984'); // default db name to "openmct"
  let backupFilename = 'backup.json'; // default backup filename to "backup.json"
  let helpRequested = false;

  args.forEach((val, index) => {
    switch (val) {
      case '--help':
        console.log(
          'Usage: restore.js  [--backupFilename pathToBackupJSON] [--dbName name] <CouchDB URL> \nFor authentication, set the environment variables COUCHDB_USERNAME and COUCHDB_PASSWORD. \n'
        );
        helpRequested = true;
        break;
      case '--dbName':
        databaseName = args[index + 1];
        break;
      case '--serverUrl':
        serverUrl = new URL(args[index + 1]);
        break;
      case '--backupFilename':
        backupFilename = args[index + 1];
        break;
    }
  });

  let username = process.env.COUCHDB_USERNAME || '';
  let password = process.env.COUCHDB_PASSWORD || '';

  return {
    backupFilename,
    serverUrl,
    databaseName,
    helpRequested,
    username,
    password
  };
}

async function getExistingDocsIdToRevMap({ serverUrl, databaseName, username, password }) {
  const baseUrl = `${serverUrl.href}${databaseName}/_find`;
  let bookmark = null;
  let existingDocs = [];
  let hasMoreDocs = true;

  const body = {
    selector: {
      _id: { $gt: null }
    },
    fields: ['_id', '_rev'],
    limit: 1000
  };

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
    existingDocs = [...existingDocs, ...findResult.docs];

    // check if we got less than limit, set hasMoreDocs to false
    hasMoreDocs = findResult.docs.length === body.limit;
  }

  return existingDocs;
}

async function performUpsert({ backupFilename, serverUrl, databaseName, username, password }) {
  console.debug(`👾 Contacting ${serverUrl}/${databaseName}`);
  const existingDocs = await getExistingDocsIdToRevMap({
    serverUrl,
    databaseName,
    username,
    password
  });
  console.debug('🐻 Existing docs:', existingDocs);
}

main();
