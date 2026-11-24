# Local Storage plugin
Provides browser `localStorage` backed persistence for Open MCT domain objects. Installing this plugin registers an object provider that stores domain objects in the browser's `localStorage`, which is useful for development, demos, and deployments without a server side persistence store such as CouchDB.

## Installation
```js
openmct.install(openmct.plugins.LocalStorage());
```

## Options
When installing, the plugin can take two options:

- `namespace`: The namespace the object provider is registered under. Defaults to the empty string `''`
  - Example: `'local-namespace'`

- `storageSpace`: The `localStorage` key under which all objects are persisted. Defaults to `'mct'`
  - Example: `'my-mct-space'`

E.g., to install with a custom namespace and storage key, you could use:

```js
openmct.install(openmct.plugins.LocalStorage('local-namespace', 'my-mct-space'));
```

## Notes
- Every object in a storage space is serialized into a single `localStorage` entry, so total capacity is bound by the browser's `localStorage` quota.
- Objects are editable. The provider reports `isReadOnly()` as `false`.
- For shared, multi user, or larger deployments, use a server backed provider such as the CouchDB persistence plugin instead.
