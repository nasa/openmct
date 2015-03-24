/*global define*/

define(
    ['./PersistenceFailureDialog', './PersistenceFailureConstants'],
    function (PersistenceFailureDialog, PersistenceFailureConstants) {
        "use strict";

        function PersistenceFailureHandler($q, dialogService, persistenceService) {
            // Refresh revision information for the domain object associated
            // with this persistence failure
            function refresh(failure) {
                // Refresh the domain object to the latest from persistence
                return failure.persistence.refresh();
            }

            // Issue a new persist call for the domain object associated with
            // this failure.
            function persist(failure) {
                // Note that we reissue the persist request here, but don't
                // return it, to avoid a circular wait. We trust that the
                // PersistenceQueue will behave correctly on the next round
                // of flushing.
                failure.requeue();
            }

            // Retry persistence (overwrite) for this set of failed attempts
            function retry(failures) {
                var models = {};

                // Cache a copy of the model
                function cacheModel(failure) {
                    // Clone...
                    models[failure.id] = JSON.parse(JSON.stringify(
                        failure.domainObject.getModel()
                    ));
                }

                // Mutate a domain object to restore its model
                function remutate(failure) {
                    var model = models[failure.id];
                    return failure.domainObject.useCapability(
                        "mutation",
                        function () { return model; },
                        model.modified
                    );
                }

                // Cache the object models we might want to save
                failures.forEach(cacheModel);

                // Strategy here:
                // * Cache all of the models we might want to save (above)
                // * Refresh all domain objects (so they are latest versions)
                // * Re-insert the cached domain object models
                // * Invoke persistence again
                return $q.all(failures.map(refresh)).then(function () {
                    return $q.all(failures.map(remutate));
                }).then(function () {
                    return $q.all(failures.map(persist));
                });
            }

            // Discard changes for a failed refresh
            function discard(failure) {
                return failure.persistence.refresh(true);
            }

            // Discard changes associated with a failed save
            function discardAll(failures) {
                return $q.all(failures.map(discard));
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
                    } else {
                        return discardAll(revisionErrors);
                    }
                }

                // Prompt for user input, the overwrite if they said so.
                return dialogService.getUserChoice(dialogModel)
                    .then(handleChoice, handleChoice);
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