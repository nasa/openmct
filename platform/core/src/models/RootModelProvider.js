/*global define,Promise*/

/**
 * Module defining RootModelProvider. Created by vwoeltje on 11/7/14.
 */
define(
    ['./StaticModelProvider.js'],
    function (StaticModelProvider) {
        "use strict";

        /**
         * The root model provider works as the static model provider,
         * except that it aggregates roots[] instead of models[], and
         * exposes them all as composition of the root object ROOT.
         *
         * @constructor
         */
        function RootModelProvider(roots, $log) {
            var ids = roots.map(function (root) {
                    return root.id;
                }),
                baseProvider = new StaticModelProvider(roots, $log);

            function addRoot(models) {
                models.ROOT = {
                    name: "The root object",
                    composition: ids
                };
                return models;
            }

            return {
                getModels: function(ids) {
                    return baseProvider.getModels(ids).then(addRoot);
                }
            };
        }

        return RootModelProvider;
    }
);