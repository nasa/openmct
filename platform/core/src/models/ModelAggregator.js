/*global define,Promise*/

/**
 * Module defining ModelAggregator. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function ModelAggregator(providers) {
            function mergeModels(provided, ids) {
                var result = {};
                ids.forEach(function (id) {
                    provided.forEach(function (models) {
                        if (models[id]) {
                            result[id] = models[id];
                        }
                    });
                });
                return result;
            }

            return {
                getModels: function (ids) {
                    return Promise.all(providers.map(function (provider) {
                        return provider.getModels(ids);
                    })).then(function (provided) {
                        return mergeModels(provided, ids);
                    });
                }
            };
        }

        return ModelAggregator;
    }
);