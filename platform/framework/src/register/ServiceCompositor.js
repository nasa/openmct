/*global define,Promise*/

/**
 * Module defining ServiceCompositor. Created by vwoeltje on 11/5/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function ServiceCompositor(app, $log) {
            var latest = {},
                providerLists = {}; // Track latest services registered

            function warn(extension, category, message) {
                var msg = message || "No service provided by";
                $log.warn([
                    msg,
                    " ",
                    category,
                    " ",
                    extension.key,
                    " from bundle ",
                    extension.bundle.path,
                    "; skipping."
                ].join(""));
            }

            // Echo arguments; used to represent groups of non-built-in
            // extensions as a single dependency.
            function echoMany() {
                return Array.prototype.slice.call(arguments);
            }

            // Echo arguments; used to represent groups of non-built-in
            // extensions as a single dependency.
            function echoSingle() {
                return arguments[0];
            }

            function hasType(type) {
                return function (extension) {
                    return extension.type === type;
                };
            }

            function makeName(category, service, index) {
                return [
                    service,
                    "[",
                    category,
                    "#",
                    index,
                    "]"
                ].join("");
            }

            function registerProvider(provider, index) {
                var service = provider.provides,
                    dependencies = provider.depends || [],
                    name = makeName("provider", service, index);

                if (!service) {
                    return warn(provider, "provider");
                }

                providerLists[service] = providerLists[service] || [];
                providerLists[service].push(name);

                // This provider is the latest candidate for resolving
                // the composite service.
                latest[service] = name;

                app.service(name, dependencies.concat([provider]));
            }

            function registerProviderSets() {
                Object.keys(providerLists).forEach(function (service) {
                    var name = makeName("provider", service, "*"),
                        list = providerLists[service];

                    app.service(name, list.concat([echoMany]));
                });
            }

            function registerAggregator(aggregator, index) {
                var service = aggregator.provides,
                    dependencies = aggregator.depends || [],
                    providerSetName = makeName("provider", service, "*"),
                    name = makeName("aggregator", service, index);

                if (!service) {
                    return warn(aggregator, "aggregator");
                }

                // Aggregators need other services to aggregate, otherwise they
                // do nothing.
                if (!latest[service]) {
                    return warn(
                        aggregator,
                        "aggregator",
                        "No services to aggregate for"
                    );
                }

                dependencies = dependencies.concat([providerSetName]);
                latest[service] = name;

                app.service(name, dependencies.concat([aggregator]));
            }

            function registerDecorator(decorator, index) {
                var service = decorator.provides,
                    dependencies = decorator.depends || [],
                    name = makeName("decorator", service, index);

                if (!service) {
                    return warn(decorator, "decorator");
                }

                // Decorators need other services to decorate, otherwise they
                // do nothing.
                if (!latest[service]) {
                    return warn(
                        decorator,
                        "decorator",
                        "No services to decorate for"
                    );
                }

                dependencies = dependencies.concat([latest[service]]);
                latest[service] = name;

                app.service(name, dependencies.concat([decorator]));
            }

            // Alias the latest services of various types back to the
            // more general service declaration.
            function registerLatest() {
                Object.keys(latest).forEach(function (service) {
                    app.service(service, [latest[service], echoSingle]);
                });
            }

            function registerComposites(providers, aggregators, decorators) {
                providers.forEach(registerProvider);
                registerProviderSets();
                aggregators.forEach(registerAggregator);
                decorators.forEach(registerDecorator);
                registerLatest();
            }

            function registerCompositeServices(components) {
                registerComposites(
                    components.filter(hasType("provider")),
                    components.filter(hasType("aggregator")),
                    components.filter(hasType("decorator"))
                );
            }

            return {
                /**
                 *
                 * @param {Array} components extensions of category component
                 */
                registerCompositeServices: registerCompositeServices
            };
        }

        return ServiceCompositor;
    }
);