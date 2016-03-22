# Public API

We need to focus on the API as a whole, so that we can design and refactor it before 1.0.  We also need to figure out what is stable and work to implementing it in a straightforward fashion.  Ideally, we can create an abstraction between the public API and the implementation to allow us to refactor the underlying implementation without breaking the API contract.

Conceptual weight is a big risk, so I advocate for focusing our API on specific concepts-- telemetry, views, domain objects, actions -- and not intermediate abstract concepts like composite providers, type registeres, etc.  We will reuse patterns in our system so as to reward users who are getting deep, but we should not force them to learn the patterns first.

At the same time, I think we should formalize a basic plugin API that allows for code to be bundled and installed in the platform.  Plugins are allowed to use any part of the public API to implement their features, and can register extensions at any of the documented extension points.

With the introduction of a plugin API, we should also start reorganizing platform code.  I think we should organize code into two categories:

* the core platform, which provides implements the Public API and takes care of a lot of "behind the scenes" functionality.
* plugins-- many of which have previously been packaged as part of the core api.  This includes examples, our various view types, our persistence adapters, etc.

We don't have to split the repository, but we should move plugins to their own set of subfolders.  It would be beneficial to start thinking about how plugins are versioned and distributed so that we can start developing stories for plugin reuse across missions.

Summary:
1. The Platform should have a stable, clear, and easy to use Public API, with specific extension points.
2. The Platform can implement this Public API however it would like, so long as good development practices are followed.
3. The Platform will expose a simple method for bundling functionality into Plugins, which can be installed, uninstalled, and shared.  However, these plugins may only use the Public API exposed by the Platform.


## Proposal: Plugin API

Plugins are very simple:  They are a function which is invoked with a single object, an instance of the MCT application.  They can directly attach functionality using the MCT public API, and they can observe the `start` event to execute code when the application starts.

Here's a pseudo plugin:

```javascript
var GenericSeachIndexer = function (mct) {
    var worker = new SearchWorker(mct);
    var provider = new GenericSearchProvider(mct, worker);
    mct.search.registerProvider(provider);
    mct.on('start', function () {
        worker.startIndexing();
    });
};

mct.install(GenericSearchIndexer);
mct.start();
```

Note that nothing prevents using the Public API without going through the plugin interface-- this is not bad!  Allowing developers to directly attach functionality without writing a plugin is a great hello-world tutorial.  Plugins can come later.

## Proposal: Internal Architecture

In the post-angular world, we should look to requirejs, browserify, or es6 modules as our primary method of separating concerns.

One benefit of these module systems is that they treat modules as singletons by default, so multiple pieces of code which depend upon a module will receive the same instance of that module.  This means that modules can depend on other modules, which sometimes makes sense.  Platform developers are expected to use their best judgement to separate concerns.

At the same time, we need a basic framework for taking a distinct set of modules and assembling the public API.

I would propose the following simple application builder framework as a starting point:

```javascript

define('Application', function () {
    function Application() {
        this._plugins = [];
    }

    Application.prototype = Object.create(EventEmitter.prototype);

    Application.prototype.install = function (plugin) {
        this._plugins.push(plugin);
    };

    Application.prototype.uninstall = function (plugin) {
        this._plugins.splice(this._plugins.indexOf(plugin), 1);
    };

    Application.prototype.start = function () {
        this._plugins.forEach(function (plugin) {
            plugin(this);
        }, this);
        this.emit('before:start');
        this.emit('start');
    };
    
    return Application;
});

define('MCT', [
    'Application',
    'modules/persistence',
    'modules/objects' // etc
], function (
    Application,
    persistenceModule,
    objectModule
) { 
    var mct = new Application();
    var modules = [
        persistenceModule,
        objectModule
    ];
    
    // modules are functions that are passed a reference to the app.
    // they attach their public API to the application.
    modules.forEach(function (module)) {
        module(app);
    };
    
    // after all modules have registered their public apis, they can initialize
    // to use public interfaces of other modules.  Potential options:
    // * setting sensible defaults using app.config
    // * attaching handlers to app.bus
    modules.forEach(function (module) {
        if (module.initialize) {
            module.initialize(app);
        }
    });

    // Calling mct.start will emit a `before:start` event and then a `start` 
    // event.  
    // `before:start` is a good time to read finalized config from app.config
    // `start` is a good time to kick off any runtime function, such as reading
    // the path from the url and navigating to a page.
    
    // at this point, any configuration changes will have been made and 
    // internal modules should use `app.config` to read these configurations.
    
    // It is worth discussing whether app.config can be modified after starting
    // the application.
    
    return mct;
});
```

## Proposal: API 1.0

The external API of MCT 1.0 has not been decided, but I would use this opportunity to start proposing what that API would look like so that we can work towards it.

This is not an exhaustive list, it comes off the top of my head.

Generally, if we don't need it, we should remove it.  We can always add to this API, but we cannot remove.

* `MCT.routes`
    something for determining how navigation is handled.  Need to handle selection of views for specific regions for specific modes.  For instance, what shows in inspector in edit mode.  May not be a public API.
* `MCT.actions`
    * `MCT.actions.registerAction(action)`
    * `MCT.actions.getActions(object)` -> `Action[]`
    * `MCT.actions.registerPolicy(ActionPolicy)`
* `MCT.views` -- manages "main view" views.
    * `MCT.views.registerView('key', view)` is key based registration a good idea?  I'm not sure.
    * `MCT.views.registerPolicy(viewPolicy)` for controlling which views apply to which object.  could be a method of views.
* `MCT.telemetry`
    * `MCT.telemetry.requestTelemetry(object, options)` -> `promise`
    * `MCT.telemetry.subscribe(object, callback, options)` -> `unsubscribe` function
    * `MCT.telemetry.registerProvider(provider)`
    * `MCT.telemetry.registerLimitEvaluator(limitEvaluator)`
    * `MCT.telemetry.getLimitEvaluator(object)`
* `MCT.persistence`
    * `MCT.persistence.registerProvider(provider)`
    * `MCT.persistence.get('key')`
    * `MCT.persistence.set('key', obj)`
    * etc.
* MCT.objects
    * `MCT.objects.registerType('key', TypeDefinition)`
    * `MCT.objects.registerPolicy(compositionPolicy)`
    * `MCT.objects.registerProvider(objectProvider)` -- would like to combine model/object/persistence some how.
* MCT.timeService
    * `MCT.time.registerFormat('key', TimeFormat)`
    * `MCT.time.getFormat('key')` -> `timeFormat`
* `MCT.bus` specifically for "optional dependencies" and loose coupling for app-wide concerns.  Using this assumes that you handle the case of a missing dependency.  Also enables app-wide event configuration.
    * `MCT.bus.register('key', handler)`
    * `MCT.bus.request('key', [arguments...])` -> `undefined` if no handler, `{...}` if handler.
    * `MCT.bus.request('conductor.bounds')` -> `{start: ..., end: ...}` or `undefined` if disabled
    * `MCT.bus.request('conductor.domain')` -> `{key: 'scet', label: 'SCET'}` or `undefined` if disabled
    * `MCT.bus.on('user.logout', function () {})`
    * `MCT.bus.on('conductor.bounds.change', reloadTelemetry)`
    * `MCT.bus.on('mutation', indexModel)`
* `MCT.config` basic key-value store for app wide config.  Assume that it won't change after application has started.
    `MCT.config.get('key')` -> `value`
    `MCT.config.set('key', value)`
    `MCT.config.set('theme', 'snow')`
    `MCT.config.get('theme')` -> `'snow'`
    `MCT.config.get('POLLING_INTERVAL')` -> `30`



