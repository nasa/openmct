/*global define*/

define(
    ['./PersistenceFailureConstants'],
    function (PersistenceFailureConstants) {
        "use strict";

        var OVERWRITE_CANCEL_OPTIONS = [
                {
                    name: "Overwrite",
                    key: PersistenceFailureConstants.OVERWRITE_KEY
                },
                {
                    name: "Cancel",
                    key: "cancel"
                }
            ],
            OK_OPTIONS = [ { name: "OK", key: "ok" } ];

        /**
         * Populates a `dialogModel` to pass to `dialogService.getUserChoise`
         * in order to choose between Overwrite and Cancel.
         */
        function PersistenceFailureDialog(failures) {
            var revisionErrors = [],
                otherErrors = [];

            // Place this failure into an appropriate group
            function categorizeFailure(failure) {
                // Check if the error is due to object revision
                var isRevisionError = ((failure || {}).error || {}).key ===
                    PersistenceFailureConstants.REVISION_ERROR_KEY;
                // Push the failure into the appropriate group
                (isRevisionError ? revisionErrors : otherErrors).push(failure);
            }

            // Separate into revision errors, and other errors
            failures.forEach(categorizeFailure);

            return {
                title: "Save Error",
                template: "persistence-failure-dialog",
                model: {
                    revised: revisionErrors,
                    unrecoverable: otherErrors
                },
                options: revisionErrors.length > 0 ?
                        OVERWRITE_CANCEL_OPTIONS : OK_OPTIONS
            };
        }

        return PersistenceFailureDialog;
    }
);