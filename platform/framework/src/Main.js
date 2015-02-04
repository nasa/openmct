/*global define, window, requirejs*/

requirejs.config({
    "shim": {
        "../lib/angular.min": {
            "exports": "angular"
        },
        "../lib/angular-route.min": {
            "deps": [ "../lib/angular.min" ]
        }
    }
});

define(
    [
        'require',
        '../lib/es6-promise-2.0.0.min',
        '../lib/angular.min',
        '../lib/angular-route.min',
        './Constants',
        './FrameworkInitializer',
        './LogLevel',
        './load/BundleLoader',
        './resolve/ImplementationLoader',
        './resolve/ExtensionResolver',
        './resolve/BundleResolver',
        './resolve/RequireConfigurator',
        './register/CustomRegistrars',
        './register/ExtensionRegistrar',
        './register/ExtensionSorter',
        './bootstrap/ApplicationBootstrapper'
    ],
    function (
        require,
        es6promise,
        angular,
        angularRoute,
        Constants,
        FrameworkInitializer,
        LogLevel,
        BundleLoader,
        ImplementationLoader,
        ExtensionResolver,
        BundleResolver,
        RequireConfigurator,
        CustomRegistrars,
        ExtensionRegistrar,
        ExtensionSorter,
        ApplicationBootstrapper
    ) {
        "use strict";

        // Get a reference to Angular's injector, so we can get $http and $log
        // services, which are useful to the framework layer.
        var injector = angular.injector(['ng']);

        // Look up log level from query string
        function logLevel() {
            var match = /[?&]log=([a-z]+)/.exec(window.location.search);
            return match ? match[1] : "";
        }

        // Polyfill Promise, in case browser does not natively provide Promise
        window.Promise = window.Promise || es6promise.Promise;

        // Wire up framework layer components necessary to complete framework
        // initialization phases.
        function initializeApplication($http, $log) {
            var app = angular.module(Constants.MODULE_NAME, ["ngRoute"]),
                loader = new BundleLoader($http, $log),
                resolver = new BundleResolver(
                    new ExtensionResolver(
                        new ImplementationLoader(require),
                        $log
                    ),
                    new RequireConfigurator(requirejs),
                    $log
                ),
                registrar = new ExtensionRegistrar(
                    app,
                    new CustomRegistrars(app, $log),
                    new ExtensionSorter($log),
                    $log
                ),
                bootstrapper = new ApplicationBootstrapper(
                    angular,
                    window.document,
                    $log
                ),
                initializer = new FrameworkInitializer(
                    loader,
                    resolver,
                    registrar,
                    bootstrapper
                );

            // Apply logging levels; this must be done now, before the
            // first log statement.
            new LogLevel(logLevel()).configure(app, $log);

            // Initialize the application
            $log.info("Initializing application.");
            initializer.runApplication(Constants.BUNDLE_LISTING_FILE);
        }

        // Reconfigure base url, since bundle paths will all be relative
        // to the root now.
        requirejs.config({ "baseUrl": "" });
        injector.invoke(['$http', '$log', initializeApplication]);
    }
);