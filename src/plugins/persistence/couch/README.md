
# Installing CouchDB

## Introduction

These instructions are for setting up CouchDB for a **development** environment. For a production environment, we recommend running Open MCT behind a proxy server (e.g., Nginx or Apache), and securing the CouchDB server properly:
<https://docs.couchdb.org/en/main/intro/security.html>

## Docker Quickstart

The following process is the preferred way of using CouchDB as it is automatic and closely resembles a production environment.

Requirement:
Get docker compose (or recent version of docker) installed on your machine. We recommend [Docker Desktop](https://www.docker.com/products/docker-desktop/)

1. Open a terminal to this current working directory (`cd openmct/src/plugins/persistence/couch`)
2. Create and start the `couchdb` container:

```sh
docker compose -f ./couchdb-compose.yaml up --detach
```
3. Copy `.env.ci` file to file named `.env.local`
4. (Optional) Change the values of `.env.local` if desired
5. Set the environment variables in bash by sourcing the env file

```sh
export $(cat .env.local | xargs)
```

6. Execute the configuration script:

```sh
sh ./setup-couchdb.sh
```

7. `cd` to the workspace root directory (the same directory as `index.html`)
8. Update `index.html` to use the CouchDB plugin as persistence store:

```sh
sh ./src/plugins/persistence/couch/replace-localstorage-with-couchdb-indexhtml.sh
```
9. ✅ Done!

Open MCT will now use your local CouchDB container as its persistence store. Access the CouchDB instance manager by visiting <http://localhost:5984/_utils>.

### Removing CouchDB Container completely

To completely remove the CouchDB container and volumes:

```sh
docker stop couch-couchdb-1;docker rm couch-couchdb-1;docker volume rm couch_couchdb
```

## macOS

While we highly recommend using the CouchDB docker-compose installation, it is still possible to install CouchDB through other means.

### Installing CouchDB

1. Install CouchDB using: `brew install couchdb`. 
2. Edit `/usr/local/etc/local.ini` and add the following settings:

  ```ini
  [admins]
  admin = youradminpassword
  ```

  And set the server up for single node:

  ```ini
  [couchdb]
  single_node=true
  ```

  Enable CORS

  ```ini
  [chttpd]
  enable_cors = true
  [cors]
  origins = http://localhost:8080
  ```


### Installing CouchDB without admin privileges to your computer

If `brew` is not available on your mac machine, you'll need to get the CouchDB installed using the official sourcefiles.
1. Install CouchDB following these instructions: <https://docs.brew.sh/Installation#untar-anywhere>.
1. Edit `local.ini` in Homebrew's `/etc/` directory as directed above in the 'Installing with admin privileges to your computer' section.

## Other Operating Systems

Follow the installation instructions from the CouchDB installation guide: <https://docs.couchdb.org/en/stable/install/index.html>

# Configuring CouchDB

## Configuration script

The simplest way to config a CouchDB instance is to use our provided tooling:
1. Copy `.env.ci` file to file named `.env.local`
2. Set the environment variables in bash by sourcing the env file

```sh
export $(cat .env.local | xargs)
```

3. Execute the configuration script:

```sh
sh ./setup-couchdb.sh
```

## Manual Configuration

1. Start CouchDB by running: `couchdb`.
2. Add the `_global_changes` database using `curl` (note the `youradminpassword` should be changed to what you set above 👆): `curl -X PUT http://admin:youradminpassword@127.0.0.1:5984/_global_changes`
3. Navigate to <http://localhost:5984/_utils>
4. Create a database called `openmct`
5. Navigate to <http://127.0.0.1:5984/_utils/#/database/openmct/permissions>
6. Remove permission restrictions in CouchDB from Open MCT by deleting `_admin` roles for both `Admin` and `Member`.

## Document Sizes
CouchDB has size limits on both its internal documents, and its httpd interface. If dealing with larger documents in Open MCT (e.g., users adding images to notebook entries), you may to increase this limit. To do this, add the following to the two sections:
```ini
  [couchdb]
  max_document_size = 4294967296 ; approx 4 GB
  
  [chttpd]
  max_http_request_size = 4294967296 ; approx 4 GB
```
  
If not present, add them under proper sections. The values are in bytes, and can be adjusted to whatever is appropriate for your use case.

# Configuring Open MCT to use CouchDB

## Configuration script
The simplest way to config a CouchDB instance is to use our provided tooling:
1. `cd` to the workspace root directory (the same directory as `index.html`)
2. Update `index.html` to use the CouchDB plugin as persistence store:

```sh
sh ./src/plugins/persistence/couch/replace-localstorage-with-couchdb-indexhtml.sh
```

## Manual Configuration

1. Edit `openmct/index.html` comment out the following line:

  ```js
  openmct.install(openmct.plugins.LocalStorage());
  ```

  Add a line to install the CouchDB plugin for Open MCT:

  ```js
  openmct.install(
        openmct.plugins.CouchDB({
          databases: [
            {
              url: 'http://localhost:5984/openmct',
              namespace: '',
              additionalNamespaces: [],
              readOnly: false,
              useDesignDocuments: false,
              indicator: true
            }
          ]
        })
      );
  ```

### Configuration Options for OpenMCT

When installing the CouchDB plugin for OpenMCT, you can specify a list of databases with configuration options for each. Here's a breakdown of the available options for each database:

- `url`: The URL to the CouchDB instance, specifying the protocol, hostname, and port as needed.
  - Example: `'http://localhost:5984/openmct'`

- `namespace`: The namespace associated with this database.
  - Example: `'openmct-sandbox'`

- `additionalNamespaces`: Other namespaces that this plugin should respond to requests for.
  - Example: `['apple-namespace', 'pear-namespace']`

- `readOnly`: A boolean indicating whether the database should be treated as read-only. If set to `true`, OpenMCT will not attempt to write to this database.
  - Example: `false`

- `useDesignDocuments`: Indicates whether design documents should be used to speed up annotation search.
  - Example: `false`

- `indicator`: A boolean to specify whether an indicator should show the status of this CouchDB connection in the OpenMCT interface.
  - Example: `true`

Note: If using the `exampleTags` plugin with non-blank namespaces, you'll need to configure it point to a writable database. For example:

```js
openmct.install(
        openmct.plugins.example.ExampleTags({ namespaceToSaveAnnotations: 'openmct-sandbox' })
      );
```

Note: If using the `MyItems` plugin, be sure to configure a root for each writable namespace. E.g., if you have two namespaces called `apple-namespace` and `pear-namespace`:
```js
      openmct.install(openmct.plugins.MyItems('Apple Items', 'apple-namespace'));
      openmct.install(openmct.plugins.MyItems('Pear Items', 'pear-namespace'));
```
This will create a root object with the id of `mine` in both namespaces upon load if not already created.

# Validating a successful Installation

1. Start Open MCT by running `npm start` in the `openmct` path.
2. Navigate to <http://localhost:8080/> and create a random object in Open MCT (e.g., a 'Clock') and save.
3. Navigate to: <http://127.0.0.1:5984/_utils/#database/openmct/_all_docs>
4. Look at the 'JSON' tab and ensure you can see the specific object you created above.
5. All done! 🏆

# Maintenance

One can delete annotations by running inside this directory (i.e., `src/plugins/persistence/couch`):
```
npm run deleteAnnotations:openmct:PIXEL_SPATIAL
```

will delete all image tags.

```
npm run deleteAnnotations:openmct 
```

will delete all tags. 

```
npm run deleteAnnotations:openmct -- --help
```

will print help options.
# Search Performance

For large Open MCT installations, it may be helpful to add additional CouchDB capabilities to bear to improve performance.

## Indexing
Indexing the `model.type` field in CouchDB can benefit the performance of queries significantly, particularly if there are a large number of documents in the database. An index can accelerate annotation searches by reducing the number of documents that the database needs to examine.

To create an index for `model.type`, you can use the following payload [using the API](https://docs.couchdb.org/en/stable/api/database/find.html#post--db-_index):

```json
{
  "index": {
    "fields": ["model.type", "model.tags"]
  },
  "name": "type_tags_index",
  "type": "json"
}
```

This instructs CouchDB to create an index on the `model.type` field and the `model.tags` field. Once this index is created, queries that include a selector on `model.type` and `model.tags` (like when searching for tags) can use this index to retrieve results faster.

You can find more detailed information about indexing in CouchDB in the [official documentation](https://docs.couchdb.org/en/stable/api/database/find.html#db-index).

## Design Documents

We can also add a design document [through the API](https://docs.couchdb.org/en/stable/api/ddoc/common.html#put--db-_design-ddoc) for retrieving domain objects for specific tags:

```json
{
  "_id": "_design/annotation_tags_index",
  "views": {
    "by_tags": {
      "map": "function (doc) { if (doc.model && doc.model.type === 'annotation' && doc.model.tags) { doc.model.tags.forEach(function (tag) { emit(tag, doc._id); }); } }"
    }
  }
}
```
and can be retrieved by issuing a `GET` to http://localhost:5984/openmct/_design/annotation_tags_index/_view/by_tags?keys=["TAG_ID_TO_SEARCH_FOR"]&include_docs=true
where `TAG_ID_TO_SEARCH_FOR` is the tag UUID we're looking for.

and for targets:
```javascript
{
  "_id": "_design/annotation_keystring_index",
  "views": {
    "by_keystring": {
      "map": "function (doc) { if (doc.model && doc.model.type === 'annotation' && doc.model.targets) { doc.model.targets.forEach(function(target) { if(target.keyString) { emit(target.keyString, doc._id); } }); } }"
    }
  }
}
```
and can be retrieved by issuing a `GET` to http://localhost:5984/openmct/_design/annotation_keystring_index/_view/by_keystring?keys=["KEY_STRING_TO_SEARCH_FOR"]&include_docs=true
where `KEY_STRING_TO_SEARCH_FOR` is the UUID we're looking for.

To enable them in Open MCT, we need to configure the plugin `useDesignDocuments` like so:

  ```js
  openmct.install(openmct.plugins.CouchDB({url: "http://localhost:5984/openmct", useDesignDocuments: true}));
  ```
