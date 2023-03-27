
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

## macOS

While we highly recommend using the CouchDB docker-compose installation, it is still possible to install CouchDB through other means.

### Installing CouchDB

1. Install CouchDB using: `brew install couchdb`. 
2. Edit `/usr/local/etc/local.ini` and add the following settings:

  ```txt
  [admins]
  admin = youradminpassword
  ```

  And set the server up for single node:

  ```txt
  [couchdb]
  single_node=true
  ```

  Enable CORS

  ```txt
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
  openmct.install(openmct.plugins.CouchDB("http://localhost:5984/openmct"));
  ```

# Validating a successful Installation

1. Start Open MCT by running `npm start` in the `openmct` path.
2. Navigate to <http://localhost:8080/> and create a random object in Open MCT (e.g., a 'Clock') and save. You may get an error saying that the object failed to persist - this is a known error that you can ignore, and will only happen the first time you save - just try again.
3. Navigate to: <http://127.0.0.1:5984/_utils/#database/openmct/_all_docs>
4. Look at the 'JSON' tab and ensure you can see the specific object you created above.
5. All done! 🏆
