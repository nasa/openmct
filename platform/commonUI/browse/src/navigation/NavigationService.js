/*global define,Promise*/

/**
 * Module defining NavigationService. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The navigation service maintains the application's current
         * navigation state, and allows listening for changes thereto.
         * @constructor
         */
        function NavigationService() {
            var navigated,
                callbacks = [];

            // Getter for current navigation
            function getNavigation() {
                return navigated;
            }

            // Setter for navigation; invokes callbacks
            function setNavigation(value) {
                if (navigated !== value) {
                    navigated = value;
                    callbacks.forEach(function (callback) {
                        callback(value);
                    });
                }
            }

            // Adds a callback
            function addListener(callback) {
                callbacks.push(callback);
            }

            // Filters out a callback
            function removeListener(callback) {
                callbacks = callbacks.filter(function (cb) {
                    return cb !== callback;
                });
            }

            return {
                /**
                 * Get the current navigation state.
                 */
                getNavigation: getNavigation,
                /**
                 * Set the current navigation state. Thiswill invoke listeners.
                 * @param {DomainObject} value the domain object to navigate
                 *        to
                 */
                setNavigation: setNavigation,
                /**
                 * Listen for changes in navigation. The passed callback will
                 * be invoked with the new domain object of navigation when
                 * this changes.
                 * @param {function} callback the callback to invoke when
                 *        navigation state changes
                 */
                addListener: addListener,
                /**
                 * Stop listening for changes in navigation state.
                 * @param {function} callback the callback which should
                 *        no longer be invoked when navigation state
                 *        changes
                 */
                removeListener: removeListener
            };
        }

        return NavigationService;
    }
);