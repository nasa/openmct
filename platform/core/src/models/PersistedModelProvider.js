/*global define,Promise*/

/**
 * Module defining PersistedModelProvider. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function PersistedModelProvider(persistenceService, $q, SPACE) {
            function promiseModels(ids) {
                return $q.all(ids.map(function (id) {
                    return persistenceService.readObject(SPACE, id);
                })).then(function (models) {
                    var result = {};
                    ids.forEach(function (id, index) {
                        result[id] = models[index];
                    });
                    return result;
                });
            }

            return {
                getModels: promiseModels
            };
        }


        return PersistedModelProvider;
    }
);