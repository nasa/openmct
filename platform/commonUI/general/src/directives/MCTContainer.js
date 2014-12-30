/*global define,Promise*/

/**
 * Module defining MCTContainer. Created by vwoeltje on 11/17/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The mct-container is similar to the mct-include directive
         * insofar as it allows templates to be referenced by
         * symbolic keys instead of by URL. Unlike mct-include, it
         * supports transclusion.
         *
         * Unlike mct-include, mct-container accepts a key as a
         * plain string attribute, instead of as an Angular
         * expression.
         *
         * @constructor
         */
        function MCTContainer(containers) {
            var containerMap = {};

            // Initialize container map from extensions
            containers.forEach(function (container) {
                var key = container.key;
                containerMap[key] = Object.create(container);
                containerMap[key].templateUrl = [
                    container.bundle.path,
                    container.bundle.resources,
                    container.templateUrl
                ].join("/");
            });

            return {

                // Allow only at the element level
                restrict: 'E',

                // Support transclusion
                transclude: true,

                // Create a new (non-isolate) scope
                scope: true,

                // Populate initial scope based on attributes requested
                // by the container definition
                link: function (scope, element, attrs) {
                    var key = attrs.key,
                        container = containerMap[key],
                        alias = "container",
                        copiedAttributes = {};

                    if (container) {
                        alias = container.alias || alias;
                        (container.attributes || []).forEach(function (attr) {
                            copiedAttributes[attr] = attrs[attr];
                        });
                    }

                    scope[alias] = copiedAttributes;
                },

                // Get the template URL for this container, based
                // on its attributes.
                templateUrl: function (element, attrs) {
                    var key = attrs.key;
                    return containerMap[key].templateUrl;
                }

            };
        }

        return MCTContainer;
    }
);