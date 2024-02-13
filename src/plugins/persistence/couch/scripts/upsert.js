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
const fs = require('fs').promises;

async function main() {
  try {
    const { serverUrl, databaseName, helpRequested, username, password, backupFilename } =
      processArguments();
    if (helpRequested) {
      return;
    }
    await performUpsert({
      backupFilename,
      serverUrl,
      databaseName,
      username,
      password
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

function processArguments() {
  const args = process.argv.slice(2);
  let databaseName = 'openmct'; // default db name to "openmct"
  let serverUrl = new URL('http://127.0.0.1:5984/'); // default db name to "openmct"
  let backupFilename = 'backup.json'; // default backup filename to "backup.json"
  let helpRequested = false;
  console.debug = () => {};

  args.forEach((val, index) => {
    switch (val) {
      case '--help':
        console.log(
          'Usage: restore.js  [--backupFilename pathToBackupJSON] [--dbName name] [--serverUrl url] [--debug] <CouchDB URL> \nFor authentication, set the environment variables COUCHDB_USERNAME and COUCHDB_PASSWORD. \n'
        );
        helpRequested = true;
        break;
      case '--dbName':
        databaseName = args[index + 1];
        break;
      case '--serverUrl':
        serverUrl = new URL(args[index + 1]);
        if (!serverUrl.href.endsWith('/')) {
          serverUrl.href += '/';
        }
        break;
      case '--backupFilename':
        backupFilename = args[index + 1];
        break;
      case '--debug':
        console.debug = console.log;
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
  console.info(`🛜 Contacting ${baseUrl} to find existing document revisions`);

  while (hasMoreDocs) {
    if (bookmark) {
      console.debug(`Server has more documents to process, fetching more...`);
      findOptions.body = JSON.stringify({
        ...body,
        bookmark
      });
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
    console.debug(
      `Fetched ${existingDocs.length} documents so far, and find result has ${findResult.docs.length} documents`
    );
  }
  console.debug(`Found ${existingDocs.length} existing documents on ${baseUrl}`);

  const idToRevMap = existingDocs.reduce((acc, doc) => {
    acc[doc._id] = doc._rev;
    return acc;
  }, {});

  return idToRevMap;
}

async function prepareBackupDocuments({ backupFilename, existingDocsIdToRevMap }) {
  // load backup file
  const rawBackup = await fs.readFile(backupFilename);
  const backupJSON = JSON.parse(rawBackup);

  console.debug(`${backupJSON.length} backup documents found in ${backupFilename}`);
  let newDocumentsToAdd = 0;
  let existingDocumentsToUpdate = 0;
  const docsToRestore = [];
  backupJSON.forEach((backupCouchDocument) => {
    if (backupCouchDocument.model && backupCouchDocument._id) {
      const existingDocRev = existingDocsIdToRevMap[backupCouchDocument._id];
      const docToRestore = {
        model: backupCouchDocument.model,
        _id: backupCouchDocument._id
      };
      if (existingDocRev) {
        // need to add rev for couchdb to update
        docToRestore._rev = existingDocRev;
        existingDocumentsToUpdate++;
      } else {
        newDocumentsToAdd++;
      }
      docsToRestore.push(docToRestore);
    } else {
      console.debug(`Skipping non-model document: ${backupCouchDocument._id}`);
    }
  });

  return { docsToRestore, newDocumentsToAdd, existingDocumentsToUpdate };
}

async function performUpsert({ backupFilename, serverUrl, databaseName, username, password }) {
  const existingDocsIdToRevMap = await getExistingDocsIdToRevMap({
    serverUrl,
    databaseName,
    username,
    password
  });

  const { docsToRestore, newDocumentsToAdd, existingDocumentsToUpdate } =
    await prepareBackupDocuments({
      backupFilename,
      existingDocsIdToRevMap
    });

  const restoreOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ docs: docsToRestore })
  };
  if (username && password) {
    restoreOptions.headers.Authorization = `Basic ${btoa(`${username}:${password}`)}`;
  }
  const baseUrl = `${serverUrl.href}${databaseName}/_bulk_docs`;
  console.info(
    `🛜 Contacting ${baseUrl} to add ${newDocumentsToAdd} new documents, and update ${existingDocumentsToUpdate} existing documents`
  );
  const restoreResponse = await fetch(baseUrl, restoreOptions);

  if (!restoreResponse.ok) {
    throw new Error(`Server responded with status: ${restoreResponse.status}`);
  }

  const restoreJsonResult = await restoreResponse.json();
  let restorationErrorCount = 0;
  let restorationSuccessCount = 0;
  restoreJsonResult.forEach((result) => {
    if (result.error) {
      console.error(`🚨 ${result.error} restoring document ${result.id} due to: ${result.reason}`);
      restorationErrorCount++;
    } else {
      restorationSuccessCount++;
    }
  });
  if (restorationErrorCount > 0) {
    console.error(`🚨 ${restorationErrorCount} documents failed to restore`);
  }
  if (restorationSuccessCount > 0) {
    console.info(`🎉 ${restorationSuccessCount} documents restored successfully`);
  }
}

main();
