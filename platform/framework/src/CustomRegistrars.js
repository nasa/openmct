/*global define,Promise*/

/**
 * Module defining CustomRegistrars. Created by vwoeltje on 11/3/14.
 */
define(
    ['./Constants'],
    function (Constants) {
        "use strict";

        /**
         * Handles registration of a few specific extension types that are
         * understood natively by Angular. This includes services and
         * directives.
         * @constructor
         */
        function CustomRegistrars(app, $log) {
            function CustomRegistrar(angularFunction) {
                function registerExtension(extension, index) {
                    var key = extension.key,
                        dependencies = extension.depends || [];

                    if (!key) {
                        $log.warn([
                            "Cannot register ",
                            angularFunction,
                            ", ",
                            index,
                            "no key specified. ",
                            JSON.stringify(extension)
                        ].join(""));
                    } else {
                        $log.info([
                            "Registering ",
                            angularFunction,
                            ": ",
                            key
                        ]);
                        app[angularFunction](
                            key,
                            dependencies.concat([extension])
                        );
                    }
                }
            }

            function registerRoute(extension, index) {
                var route = Object.create(extension);

                // Adjust path for bundle
                if (route.templateUrl) {
                    route.templateUrl = [
                        route.bundle.path,
                        route.bundle.resources,
                        route.templateUrl
                    ].join(Constants.SEPARATOR);
                }

                // Register the route with Angular
                app.config(['$routeProvider', function ($routeProvider) {
                    if (route.when) {
                        $routeProvider.when(route.when, route);
                    } else {
                        $routeProvider.otherwise(route);
                    }
                }]);
            }

            return {
                routes: registerRoute
                services: new CustomRegistrar("service")
            };
        }

        return CustomRegistrars;
    }
);