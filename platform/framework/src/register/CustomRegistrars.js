/*global define,Promise*/

/**
 * Module defining CustomRegistrars. Created by vwoeltje on 11/3/14.
 */
define(
    ['../Constants'],
    function (Constants) {
        "use strict";

        /**
         * Handles registration of a few specific extension types that are
         * understood natively by Angular. This includes services and
         * directives.
         * @constructor
         */
        function CustomRegistrars(app, $log) {

            // Used to create custom registration functions which map to
            // named methods on Angular modules, which follow the normal
            // app.method(key, [ deps..., function ]) pattern.
            function CustomRegistrar(angularFunction) {
                return function (extension, index) {
                    var key = extension.key,
                        dependencies = extension.depends || [];


                    if (!key) {
                        $log.warn([
                            "Cannot register ",
                            angularFunction,
                            " ",
                            index,
                            ", no key specified. ",
                            JSON.stringify(extension)
                        ].join(""));
                    } else {
                        $log.info([
                            "Registering ",
                            angularFunction,
                            ": ",
                            key
                        ].join(""));
                        app[angularFunction](
                            key,
                            dependencies.concat([extension])
                        );
                    }
                };
            }

            // Custom registration function for extensions of category "route"
            function registerRoute(extension) {
                var route = Object.create(extension);

                // Adjust path for bundle
                if (route.templateUrl) {
                    route.templateUrl = [
                        route.bundle.path,
                        route.bundle.resources,
                        route.templateUrl
                    ].join(Constants.SEPARATOR);
                }

                // Log the registration
                $log.info("Registering route: " + (route.key || route.when));

                // Register the route with Angular
                app.config(['$routeProvider', function ($routeProvider) {
                    if (route.when) {
                        $routeProvider.when(route.when, route);
                    } else {
                        $routeProvider.otherwise(route);
                    }
                }]);
            }

            // Handle service compositing
            function registerComponents(components) {
                return new ServiceCompositor(app, $log)
                        .registerCompositeServices(components);
            }

            // Utility; create a function which converts another function
            // (which acts on single objects) to one which acts upon arrays.
            function mapUpon(func) {
                return function(array) {
                    return array.map(func);
                };
            }

            // More like key-value pairs than methods; key is the
            // name of the extension category to be handled, and the value
            // is the function which handles it.
            return {
                routes: mapUpon(registerRoute),
                directives: mapUpon(new CustomRegistrar("directive")),
                controllers: mapUpon(new CustomRegistrar("controller")),
                services: mapUpon(new CustomRegistrar("service")),
                components: registerComponents
            };
        }

        return CustomRegistrars;
    }
);