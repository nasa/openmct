/*global define*/

/**
 * Defines MergedModel, which allows a deep merge of domain object
 * models, or JSONifiable JavaScript objects generally.
 *
 */
define(
    function () {
        'use strict';

        /**
         * Utility function for merging domain object models (or any
         * JavaScript object which follows the same conventions.)
         * Performs a "deep merge", resolving conflicts (occurrences
         * of the same property in both objects) such that:
         *
         * * Non-conflicting properties are both contained in the
         *   result object.
         * * Conflicting properties which are both arrays are
         *   concatenated.
         * * Conflicting properties which are both objects are
         *   merged recursively.
         * * Conflicting properties which do not fall into any of the
         *   preceding categories are taken from the second argument,
         *   shadowing any values from the first.
         *
         * An optional third argument, the "merger", may be provided.
         * This may be either a function, or an object containing
         * key-value pairs where keys are strings (corresponding to
         * the names of properties) and values are other mergers
         * (either functions or objects.)
         *
         * * If the merger is a function, it will be used upon the
         *   two input objects in lieu of the behavior described
         *   above.
         * * If the merger is an object, then its values will be
         *   used as mergers when resolving properties with
         *   corresponding keys in the recursive step.
         *
         *
         * @param a the first object to be merged
         * @param b the second object to be merged
         * @param merger the merger, as described above
         * @returns {*} the result of merging `a` and `b`
         */
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

            mergeFunction = (merger && Function.isFunction(merger)) ? merger :
                    (Array.isArray(a) && Array.isArray(b)) ? mergeArrays :
                            (a instanceof Object && b instanceof Object) ? mergeObjects :
                                    mergeOther;

            return mergeFunction(a, b);
        }

        return mergeModels;
    }
);