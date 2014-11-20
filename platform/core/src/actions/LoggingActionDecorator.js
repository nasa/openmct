/*global define,Promise*/

/**
 * Module defining LoggingActionDecorator. Created by vwoeltje on 11/17/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function LoggingActionDecorator($log, actionService) {
            function addLogging(action) {
                var logAction = Object.create(action),
                    domainObject =
                        action.getMetadata().context.domainObject;

                logAction.perform = function () {
                    $log.info([
                        "Performing action ",
                        action.getMetadata().key,
                        " upon ",
                        domainObject && domainObject.getId()
                    ].join(""));
                    return action.perform.apply(action, arguments);
                };

                return logAction;
            }

            return {
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