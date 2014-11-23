/*global define,Promise*/

/**
 * Module defining NavigationService. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function NavigationService() {
            var navigated,
                callbacks = [];

            function getNavigation() {
                return navigated;
            }

            function setNavigation(value) {
                navigated = value;
                callbacks.forEach(function (callback) {
                    callback(value);
                });
            }

            function addListener(callback) {
                callbacks.push(callback);
            }

            function removeListener(callback) {
                callbacks = callbacks.filter(function (cb) {
                    return cb !== callback;
                });
            }

            return {
                getNavigation: getNavigation,
                setNavigation: setNavigation,
                addListener: addListener,
                removeListener: removeListener
            };
        }

        return NavigationService;
    }
);