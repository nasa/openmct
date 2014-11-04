/*global define, window, requirejs*/

requirejs.config({
    "shim": {
        "../lib/angular.min": {
            "exports": "angular"
        }
    }
});

define(
    [
        'require',
        '../lib/es6-promise-2.0.0.min',
        '../lib/angular.min',
        './Constants',
        './FrameworkInitializer',
        './BundleLoader',
        './ImplementationLoader',
        './ExtensionResolver',
        './BundleResolver',
        './CustomRegistrars',
        './ExtensionRegistrar',
        './ApplicationBootstrapper'
    ],
    function (require,
              es6promise,
              angular,
              Constants,
              FrameworkInitializer,
              BundleLoader,
              ImplementationLoader,
              ExtensionResolver,
              BundleResolver,
              CustomRegistrars,
              ExtensionRegistrar,
              ApplicationBootstrapper
        ) {
        "use strict";

        // Get a reference to Angular's injector, so we can get $http and $log
        // services, which are useful to the framework layer.
        var injector = angular.injector(['ng']);

        // Polyfill Promise, in case browser does not natively provide Promise
        window.Promise = window.Promise || es6promise.Promise;

        // Wire up framework layer components necessary to complete framework
        // initialization phases.
        function initializeApplication($http, $log) {
            var app = angular.module(Constants.MODULE_NAME, []),
                loader = new BundleLoader($http, $log),
                resolver = new BundleResolver(new ExtensionResolver(
                    new ImplementationLoader(require),
                    $log
                )),
                registrar = new ExtensionRegistrar(
                    app,
                    new CustomRegistrars(app, $log),
                    $log
                ),
                bootstrapper = new ApplicationBootstrapper(
                    angular,
                    window.document
                ),
                initializer = new FrameworkInitializer(
                    loader,
                    resolver,
                    registrar,
                    bootstrapper
                );

            $log.info("Initializing application.");
            initializer.runApplication(Constants.BUNDLE_LISTING_FILE);
        }

        injector.invoke(['$http', '$log', initializeApplication]);
    }
);