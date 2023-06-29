export default function (folderName, couchPlugin, searchFilter) {
  return function install(openmct) {
    const couchProvider = couchPlugin.couchProvider;
    const couchSearchName = `couch-search-${folderName || 'CouchDB Documents'}`;

    openmct.objects.addRoot({
      namespace: couchSearchName,
      key: couchSearchName
    });
    console.log('adding', couchSearchName);

    openmct.objects.addProvider(couchSearchName, {
      get(identifier) {
        console.log(couchSearchName, identifier);

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
