/*global define,Promise*/

/**
 * Module defining LoggingActionDecorator. Created by vwoeltje on 11/17/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The LoggingActionDecorator decorates an ActionService such that
         * the actions it exposes always emit a log message when they are
         * performed.
         *
         * @constructor
         */
        function LoggingActionDecorator($log, actionService) {
            // Decorate the perform method of the specified action, such that
            // it emits a log message whenever performed.
            function addLogging(action) {
                var logAction = Object.create(action),
                    metadata = action.getMetadata() || {},
                    context = metadata.context || {},
                    domainObject = context.domainObject;

                logAction.perform = function () {
                    $log.info([
                        "Performing action ",
                        metadata.key,
                        " upon ",
                        domainObject && domainObject.getId()
                    ].join(""));
                    return action.perform.apply(action, arguments);
                };

                return logAction;
            }

            return {
                /**
                 * Get a list of actions which are valid in a given
                 * context. These actions will additionally log
                 * themselves when performed.
                 *
                 * @param {ActionContext} the context in which
                 *        the action will occur; this is a
                 *        JavaScript object containing key-value
                 *        pairs. Typically, this will contain a
                 *        field "domainObject" which refers to
                 *        the domain object that will be acted
                 *        upon, but may contain arbitrary information
                 *        recognized by specific providers.
                 * @return {Action[]} an array of actions which
                 *        may be performed in the provided context.
                 *
                 * @method
                 * @memberof LoggingActionDecorator
                 */
                getActions: function () {
                    return actionService.getActions.apply(
                        actionService,
                        arguments
                    ).map(addLogging);
                }
            };
        }

        return LoggingActionDecorator;
    }
);