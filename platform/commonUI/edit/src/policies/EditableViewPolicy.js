/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Policy controlling which views should be visible in Edit mode.
         * @constructor
         */
        function EditableViewPolicy() {
            return {
                /**
                 * Check whether or not a given action is allowed by this
                 * policy.
                 * @param {Action} action the action
                 * @param domainObject the domain object which will be viewed
                 * @returns {boolean} true if not disallowed
                 */
                allow: function (view, domainObject) {
                    // If a view is flagged as non-editable, only allow it
                    // while we're not in Edit mode.
                    if ((view || {}).editable === false) {
                        return !domainObject.hasCapability('editor');
                    }

                    // Like all policies, allow by default.
                    return true;
                }
            };
        }

        return EditableViewPolicy;
    }
);