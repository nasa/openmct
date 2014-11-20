/*global define,Promise*/

/**
 * Module defining StaticModelProvider. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Loads static models, provided as declared extensions of bundles.
         * @constructor
         */
        function StaticModelProvider(models, $log) {
            var modelMap = {};

            function addModelToMap(model) {
                // Skip models which don't look right
                if (typeof model !== 'object' ||
                        typeof model.id !== 'string' ||
                        typeof model.model !== 'object') {
                    $log.warn([
                        "Skipping malformed domain object model exposed by ",
                        ((model || {}).bundle || {}).path
                    ].join(""));
                } else {
                    modelMap[model.id] = model.model;
                }
            }

            // Prepoulate maps with models to make subsequent lookup faster.
            models.forEach(addModelToMap);

            return {
                /**
                 * Get models for these specified string identifiers.
                 * These will be given as an object containing keys
                 * and values, where keys are object identifiers and
                 * values are models.
                 * This result may contain either a subset or a
                 * superset of the total objects.
                 *
                 * @param {Array<string>} ids the string identifiers for
                 *        models of interest.
                 * @returns {Promise<object>} a promise for an object
                 *          containing key-value pairs, where keys are
                 *          ids and values are models
                 * @method
                 * @memberof StaticModelProvider#
                 */
                getModels: function (ids) {
                    var result = {};
                    ids.forEach(function (id) {
                        result[id] = modelMap[id];
                    });
                    return Promise.resolve(result);
                }
            };
        }

        return StaticModelProvider;
    }
);