/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Disallow composition changes to objects which are not mutable.
         * @constructor
         */
        function CompositionMutabilityPolicy() {
            return {
                /**
                 * Is the type identified by the candidate allowed to
                 * contain the type described by the context?
                 * @param {Type} candidate the type of domain object
                 */
                allow: function (candidate) {
                    // Equate creatability with mutability; that is, users
                    // can only modify objects of types they can create, and
                    // vice versa.
                    return candidate.hasFeature('creation');
                }
            };
        }

        return CompositionMutabilityPolicy;
    }
);