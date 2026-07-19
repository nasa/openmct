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
      },
      search() {
        return Promise.resolve([]);
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
        let searchResults;

        if (searchFilter.viewName !== undefined) {
          // Use a view to search, instead of an _all_docs find
          searchResults = couchProvider.getObjectsByView(searchFilter);
        } else {
          // Use the _find endpoint to search _all_docs
          searchResults = couchProvider.getObjectsByFilter(searchFilter);
        }

        return searchResults;
      }
    });
  };
}
