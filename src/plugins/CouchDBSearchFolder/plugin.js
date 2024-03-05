export default function (folderName, couchPlugin, searchFilter) {
  const DEFAULT_NAME = 'CouchDB Documents';

  return function install(openmct) {
    const couchProvider = couchPlugin.couchProvider;
    //replace any non-letter/non-number with a hyphen
    const couchSearchId = (folderName || DEFAULT_NAME).replace(/[^a-zA-Z0-9]/g, '-');
    const couchSearchName = `couch-search-${couchSearchId}`;

    openmct.objects.addRoot({
      namespace: couchSearchName,
      key: couchSearchName
    });

    openmct.objects.addProvider(couchSearchName, {
      get(identifier) {
        if (identifier.key !== couchSearchName) {
          return undefined;
        } else {
          return Promise.resolve({
            identifier,
            type: 'folder',
            name: folderName || DEFAULT_NAME,
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
