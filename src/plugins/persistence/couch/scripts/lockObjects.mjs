import debounce from 'p-debounce';

const BATCH_SIZE = 100;
const startObjectKeystring = 'mine';
const locked = true;
const couchUrl = 'http://localhost:5984';
const database = 'openmct';
const user = 'admin';
const password = 'password';
const startObjectIdentifier = keystringToIdentifier(startObjectKeystring);
const documentBatch = [];
const debouncedPersistBatch = debounce(persistBatch, 200);
const alreadySeen = new Set();

await processObjectTreeFrom(startObjectIdentifier);

function processObjectTreeFrom(parentObjectIdentifier) {
  //1. Fetch document for identifier;
  return fetchDocument(parentObjectIdentifier).then((document) => {
    if (document !== undefined) {
      if (!alreadySeen.has(document._id)) {
        alreadySeen.add(document._id);
        //2. Lock object
        document.model.locked = locked;
        document.model.disallowUnlock = locked;
        //3. Push document to a batch
        documentBatch.push(document);
        //4. Persist batch if necessary, reporting failures
        persistBatchIfNeeded();
        //5. Repeat for each composee
        const composition = document.model.composition || [];
        composition.forEach((composee) => {
          processObjectTreeFrom(composee);
        });
      }
    }
  });
}

async function fetchDocument(identifierOrKeystring) {
  let keystring;
  let identifier;
  if (typeof identifierOrKeystring === 'object') {
    identifier = identifierOrKeystring;
    keystring = identifierToKeystring(identifier);
  } else {
    keystring = identifierOrKeystring;
    identifier = keystringToIdentifier(keystring);
  }

  const url = `${couchUrl}/${database}/${keystring}`;
  const response = await fetch(url);

  if (response.status === 200) {
    return response.json();
  } else {
    return undefined;
  }
}

function persistBatchIfNeeded() {
  if (documentBatch.length >= BATCH_SIZE) {
    persistBatch();
  } else {
    //Final batch will be < 100 in length, so make sure we always persist one final time
    debouncedPersistBatch();
  }
}

async function persistBatch() {
  const headers = new Headers();
  headers.set('Authorization', 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64'));
  headers.set('Content-Type', 'application/json');

  const body = {
    docs: []
  };

  while (documentBatch.length > 0) {
    const document = documentBatch.shift();
    body.docs.push(document);
  }

  const url = `${couchUrl}/${database}/_bulk_docs`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  const json = await response.json();
  const objectReplies = json;

  if (response.status === 200 || response.status === 201) {
    console.log(`Successfully updated ${body.docs.length} objects...`);
  } else {
    console.log(`Error updating objects`);
  }

  objectReplies.forEach((or) => {
    if (or.ok !== true) {
      console.log(`Failed: ${JSON.stringify(or)}`);
    } else {
      console.log(`Success: ${JSON.stringify(or)}`);
    }
  });
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
