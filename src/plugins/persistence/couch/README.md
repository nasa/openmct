# Follow CouchDB installation instructions
# Installing CouchDB for OSX
1. `brew install couchdb`
2. CouchDB 3.x requires a set admin password set before startup.
Add one to your /usr/local/etc/local.ini before starting CouchDB e.g.:
  [admins]
  admin = youradminpassword
3. Setup for single node:
add to `/usr/local/etc/local.ini` [couchdb] single_node=true
`curl -X PUT http://admin:password@127.0.0.1:5984/_global_changes`


# Configuring OpenMCT to use CouchDB for Development
1. Navigate to http://localhost:5984/_utils
2. Create a database called `openmct`
3. Edit openmct/index.html
4. Comment out `openmct.install(openmct.plugins.LocalStorage());`
5. Add line to install `openmct.install(openmct.plugins.CouchDB("http://localhost:5984/openmct/"));`
6. Enable cors in couchdb by editing `/usr/local/etc/local.ini` and add to `[chttpd]` `enable_cors = true`
Add to `[cors]`
`origins = http://localhost:8080`
7. Remove permissions in CouchDB from openmct by navigating to http://127.0.0.1:5984/_utils/#/database/openmct/permissions and deleting `_admin` roles
8. You may get an error saying objects failed to persist. You can ignore this and it only happen once.