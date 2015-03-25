/*global define*/

define(
    ['moment', './PersistenceFailureConstants'],
    function (moment, Constants) {
        "use strict";

        /**
         * Controller to support the template to be shown in the
         * dialog shown for persistence failures.
         */
        function PersistenceFailureController() {
            return {
                /**
                 * Format a timestamp for display in the dialog.
                 */
                formatTimestamp: function (timestamp) {
                    return moment.utc(timestamp)
                        .format(Constants.TIMESTAMP_FORMAT);
                },
                /**
                 * Format a user name for display in the dialog.
                 */
                formatUsername: function (username) {
                    return username || Constants.UNKNOWN_USER;
                }
            };
        }

        return PersistenceFailureController;
    }
);