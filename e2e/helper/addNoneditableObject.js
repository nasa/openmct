(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const PERSISTENCE_KEY = 'persistence-tests';
    const openmct = window.openmct;

    openmct.objects.addRoot({
      namespace: PERSISTENCE_KEY,
      key: PERSISTENCE_KEY
    });

    openmct.objects.addProvider(PERSISTENCE_KEY, {
      get(identifier) {
        if (identifier.key !== PERSISTENCE_KEY) {
          return undefined;
        } else {
          return Promise.resolve({
            identifier,
            type: 'folder',
            name: 'Persistence Testing',
            location: 'ROOT',
            composition: []
          });
        }
      }
    });
  });
})();
