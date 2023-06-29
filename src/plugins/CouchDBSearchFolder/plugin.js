import { v4 as uuid } from 'uuid';

export default function (folderName, couchPlugin, searchFilter) {
  return function install(openmct) {
    const couchProvider = couchPlugin.couchProvider;
    const couchSearchId = uuid();
    const couchSearchName = `couch-search-${couchSearchId}`;

    openmct.objects.addRoot({
      namespace: couchSearchName,
      key: couchSearchName
    });

    console.log('added root', couchSearchName);

    openmct.objects.addProvider(couchSearchName, {
      get(identifier) {
        console.log('looking for provider', identifier, couchSearchName);

        if (identifier.key !== couchSearchName) {
          return undefined;
        } else {
          return Promise.resolve({
            identifier,
            type: 'folder',
            name: folderName || 'CouchDB Documents',
            location: 'ROOT'
          });
        }
      }
    });

    openmct.composition.addProvider({
      appliesTo(domainObject) {
        return (
          domainObject.identifier.namespace === couchSearchName &&
          domainObject.identifier.key === couchSearchName
        );
      },
      load() {
        return couchProvider.getObjectsByFilter(searchFilter).then((objects) => {
          return objects.map((object) => object.identifier);
        });
      }
    });
  };
}
