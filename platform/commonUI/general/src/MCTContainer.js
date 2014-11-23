/*global define,Promise*/

/**
 * Module defining MCTContainer. Created by vwoeltje on 11/17/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
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
                restrict: 'E',
                transclude: true,
                scope: true,
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
                templateUrl: function (element, attrs) {
                    var key = attrs.key;
                    return containerMap[key].templateUrl;
                }
            };
        }

        return MCTContainer;
    }
);