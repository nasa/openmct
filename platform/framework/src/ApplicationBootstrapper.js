/*global define,Promise*/

/**
 * Module defining Bootstrapper. Created by vwoeltje on 11/4/14.
 *
 * The bootstrapper is responsible
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The application bootstrapper is responsible for issuing the
         * bootstrap call to Angular. This would normally not be needed
         * with an appropriately-placed ng-app directive, but the
         * framework needs to wait until all extensions have been loaded
         * and registered.
         *
         * @constructor
         */
        function ApplicationBootstrapper(angular, document) {
            return {
                /**
                 * @method
                 * @memberof ApplicationBootstrapper#
                 * @param {angular.Module} app the Angular application to
                 *        bootstrap
                 */
                bootstrap: function (app) {
                    angular.element(document).ready(function () {
                        angular.bootstrap(document, [app.name]);
                    });
                }
            };
        }

        return ApplicationBootstrapper;
    }
);