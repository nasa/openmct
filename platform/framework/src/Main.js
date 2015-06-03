/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
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