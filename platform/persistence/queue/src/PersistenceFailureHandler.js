/*global define*/

define(
    ['./PersistenceFailureDialog', './PersistenceFailureConstants'],
    function (PersistenceFailureDialog, PersistenceFailureConstants) {
        "use strict";

        function PersistenceFailureHandler($q, dialogService, persistenceService) {
            // Refresh revision information for the domain object associated
            // with htis persistence failure
            function refresh(failure) {
                // Perform a new read; this should update the persistence
                // service's local revision records, so that the next request
                // should permit the overwrite
                return persistenceService.readObject(
                    failure.persistence.getSpace(),
                    failure.id,
                    { cache: false } // Disallow caching
                );
            }

            // Issue a new persist call for the domain object associated with
            // this failure.
            function persist(failure) {
                var undecoratedPersistence =
                    failure.domainObject.getCapability('persistence');
                return undecoratedPersistence &&
                        undecoratedPersistence.persist();
            }

            // Retry persistence for this set of failed attempts
            function retry(failures) {
                // Refresh all objects within the persistenceService to
                // get up-to-date revision information; once complete,
                // reissue the persistence request.
                return $q.all(failures.map(refresh)).then(function () {
                    return $q.all(failures.map(persist));
                });
            }

            // Handle failures in persistence
            function handleFailures(failures) {
                // Prepare dialog for display
                var dialogModel = new PersistenceFailureDialog(failures),
                    revisionErrors = dialogModel.model.revised;

                // Handle user input (did they choose to overwrite?)
                function handleChoice(key) {
                    // If so, try again
                    if (key === PersistenceFailureConstants.OVERWRITE_KEY) {
                        return retry(revisionErrors);
                    }
                }

                // Prompt for user input, the overwrite if they said so.
                return dialogService.getUserChoice(dialogModel)
                    .then(handleChoice);
            }

            return {
                /**
                 * Handle persistence failures by providing the user with a
                 * dialog summarizing these failures, and giving the option
                 * to overwrite/cancel as appropriate.
                 * @param {Array} failures persistence failures, as prepared
                 *        by PersistenceQueueHandler
                 */
                handle: handleFailures
            };
        }

        return PersistenceFailureHandler;
    }
);