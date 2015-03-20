/*global define*/

define(
    ['./PersistenceFailureDialog', './PersistenceFailureConstants'],
    function (PersistenceFailureDialog, PersistenceFailureConstants) {
        "use strict";

        function PersistenceFailureHandler($q, dialogService, persistenceService) {
            function refresh(failure) {

            }

            function retry(failures) {

            }

            function handleFailures(failures) {
                var dialogModel = new PersistenceFailureDialog(failures),
                    revisionErrors = dialogModel.model.revised;

                function handleChoice(key) {
                    if (key === PersistenceFailureConstants.OVERWRITE_KEY) {
                        return retry(revisionErrors);
                    }
                }

                return dialogService.getUserChoice(dialogModel)
                    .then(handleChoice);
            }

            return {
                handle: handleFailures
            };
        }

        return PersistenceFailureHandler;
    }
);