import http from 'http';
import nano from 'nano';
import { parseArgs } from 'util';

const COUCH_URL = process.env.OPENMCT_COUCH_URL || 'http://127.0.0.1:5984';
const COUCH_DB_NAME = process.env.OPENMCT_DATABASE_NAME || 'openmct';

const {
  values: { couchUrl, database, lock, unlock, startObjectKeystring, user, pass }
} = parseArgs({
  options: {
    couchUrl: {
      type: 'string',
      default: COUCH_URL
    },
    database: {
      type: 'string',
      short: 'd',
      default: COUCH_DB_NAME
    },
    lock: {
      type: 'boolean',
      short: 'l'
    },
    unlock: {
      type: 'boolean',
      short: 'u'
    },
    startObjectKeystring: {
      type: 'string',
      short: 'o',
      default: 'mine'
    },
    user: {
      type: 'string'
    },
    pass: {
      type: 'string'
    }
  }
});

const BATCH_SIZE = 100;
const SOCKET_POOL_SIZE = 100;

const locked = lock === true;
console.info(`Connecting to ${couchUrl}/${database}`);
console.info(`${locked ? 'Locking' : 'Unlocking'} all children of ${startObjectKeystring}`);

const poolingAgent = new http.Agent({
  keepAlive: true,
  maxSockets: SOCKET_POOL_SIZE
});

const db = nano({
  url: couchUrl,
  requestDefaults: {
    agent: poolingAgent
  }
}).use(database);
db.auth(user, pass);

if (!unlock && !lock) {
  throw new Error('Either -l or -u option is required');
}

const startObjectIdentifier = keystringToIdentifier(startObjectKeystring);
const documentBatch = [];
const alreadySeen = new Set();
let updatedDocumentCount = 0;

await processObjectTreeFrom(startObjectIdentifier);
//Persist final batch
await persistBatch();
console.log(`Processed ${updatedDocumentCount} documents`);

function processObjectTreeFrom(parentObjectIdentifier) {
  //1. Fetch document for identifier;
  return fetchDocument(parentObjectIdentifier)
    .then(async (document) => {
      if (document !== undefined) {
        if (!alreadySeen.has(document._id)) {
          alreadySeen.add(document._id);
          //2. Lock or unlock object
          document.model.locked = locked;
          document.model.disallowUnlock = locked;

          if (locked) {
            document.model.lockedBy = 'script';
          } else {
            delete document.model.lockedBy;
          }
          //3. Push document to a batch
          documentBatch.push(document);
          //4. Persist batch if necessary, reporting failures
          await persistBatchIfNeeded();
          //5. Repeat for each composee
          const composition = document.model.composition || [];
          return Promise.all(
            composition.map((composee) => {
              return processObjectTreeFrom(composee);
            })
          );
        }
      }
    })
    .catch((error) => {
      console.log(`Error ${error}`);
    });
}

async function fetchDocument(identifierOrKeystring) {
  let keystring;
  if (typeof identifierOrKeystring === 'object') {
    keystring = identifierToKeystring(identifierOrKeystring);
  } else {
    keystring = identifierOrKeystring;
  }

  try {
    const document = await db.get(keystring);

    return document;
  } catch (error) {
    return undefined;
  }
}

function persistBatchIfNeeded() {
  if (documentBatch.length >= BATCH_SIZE) {
    return persistBatch();
  } else {
    //Noop - batch is not big enough yet
    return;
  }
}

async function persistBatch() {
  try {
    const localBatch = [].concat(documentBatch);

    //Immediately clear the shared batch array. This asynchronous process is non-blocking, and
    //we don't want to try and persist the same batch multiple times while we are waiting for
    //the subsequent bulk operation to complete.
    updatedDocumentCount += documentBatch.length;

    documentBatch.splice(0, documentBatch.length);
    const response = await db.bulk({ docs: localBatch });

    if (response instanceof Array) {
      response.forEach((r) => {
        console.info(JSON.stringify(r));
      });
    } else {
      console.info(JSON.stringify(response));
    }
  } catch (error) {
    if (error instanceof Array) {
      error.forEach((e) => console.error(JSON.stringify(e)));
    } else {
      console.error(`${error.statusCode} - ${error.reason}`);
    }
  }
}

function keystringToIdentifier(keystring) {
  const tokens = keystring.split(':');
  if (tokens.length === 2) {
    return {
      namespace: tokens[0],
      key: tokens[1]
    };
  } else {
    return {
      namespace: '',
      key: tokens[0]
    };
  }
}

function identifierToKeystring(identifier) {
  if (typeof identifier === 'string') {
    return identifier;
  } else if (typeof identifier === 'object') {
    if (identifier.namespace) {
      return `${identifier.namespace}:${identifier.key}`;
    } else {
      return identifier.key;
    }
  }
}
