/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * An editable model cache stores domain object models that have been
         * made editable, to support a group that can be saved all-at-once.
         * This is useful in Edit mode, which is launched for a specific
         * object but may contain changes across many objects.
         * @constructor
         */
        function EditableModelCache() {
            var cache = {};

            // Deep-copy a model. Models are JSONifiable, so this can be
            // done by stringification then destringification
            function clone(model) {
                return JSON.parse(JSON.stringify(model));
            }

            return {
                /**
                 * Get this domain object's model from the cache (or
                 * place it in the cache if it isn't in the cache yet)
                 * @returns a clone of the domain object's model
                 */
                getCachedModel: function (domainObject) {
                    var id = domainObject.getId();

                    return (cache[id] =
                        cache[id] || clone(domainObject.getModel()));
                }
            };

        }

        return EditableModelCache;
    }
);