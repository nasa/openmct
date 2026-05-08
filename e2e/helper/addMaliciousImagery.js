document.addEventListener('DOMContentLoaded', () => {
  const openmct = window.openmct;

  const maliciousTypeConfig = {
    key: 'malicious.imagery',
    name: 'Malicious Test Imagery',
    cssClass: 'icon-image',
    creatable: true,
    initialize: (object) => {
      object.telemetry = {
        values: [
          { name: 'Time', key: 'utc', format: 'utc', hints: { domain: 1 } },
          { name: 'Image', key: 'url', format: 'image', hints: { image: 1 } }
        ]
      };
    }
  };

  const mockProvider = {
    supportsRequest: (domainObject) => domainObject.type === 'malicious.imagery',
    request: (domainObject) => {
      return Promise.resolve([
        {
          utc: Date.now(),
          url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7#javascript:alert(1)'
        }
      ]);
    }
  };

  openmct.types.addType(maliciousTypeConfig.key, maliciousTypeConfig);
  openmct.telemetry.addProvider(mockProvider);
});
