/*global define*/

/**
 * Defines MergedModel, which allows a deep merge of domain object
 * models, or JSONifiable JavaScript objects generally.
 *
 * @module core/model/merged-model
 */
define(
    function () {
        'use strict';

        function mergeModels(a, b, merger) {
            var mergeFunction;

            function mergeArrays(a, b) {
                return a.concat(b);
            }

            function mergeObjects(a, b) {
                var result = {};
                Object.keys(a).forEach(function (k) {
                    result[k] = b.hasOwnProperty(k) ?
                            mergeModels(a[k], b[k], (merger || {})[k]) :
                            a[k];
                });
                Object.keys(b).forEach(function (k) {
                    // Copy any properties not already merged
                    if (!a.hasOwnProperty(k)) {
                        result[k] = b[k];
                    }
                });
                return result;
            }

            function mergeOther(a, b) {
                return b;
            }

            mergeFunction = merger && Function.isFunction(merger) ? merger :
                    (Array.isArray(a) && Array.isArray(b)) ? mergeArrays :
                            (a instanceof Object && b instanceof Object) ? mergeObjects :
                                    mergeOther;

            return mergeFunction(a, b);
        }

        return mergeModels;
    }
);