/*global define,Promise*/

/**
 * Module defining ActionCapability. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function ActionCapability(actionService, domainObject) {
            var self;

            function getActions(context) {
                var baseContext = typeof context === 'string' ?
                        { key: context } :
                        (context || {}),
                    actionContext = Object.create(baseContext);

                actionContext.domainObject = domainObject;

                return actionService.getActions(actionContext);
            }

            function performAction(context) {
                var actions = getActions(context);

                return Promise.resolve(
                    (actions && actions.length > 0) ?
                            actions[0].perform() :
                            undefined
                );
            }

            self = {
                invoke: function () {
                    return self;
                },
                perform: performAction,
                getActions: getActions

            };

            return self;
        }

        return ActionCapability;
    }
);