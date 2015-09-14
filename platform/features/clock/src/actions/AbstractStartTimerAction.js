/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Implements the "Start" and "Restart" action for timers.
         *
         * Sets the reference timestamp in a timer to the current
         * time, such that it begins counting up.
         *
         * Both "Start" and "Restart" share this implementation, but
         * control their visibility with different `appliesTo` behavior.
         *
         * @implements Action
         */
        function AbstractStartTimerAction(now, context) {
            var domainObject = context.domainObject;

            function doPersist() {
                var persistence = domainObject.getCapability('persistence');
                return persistence && persistence.persist();
            }

            function setTimestamp(model) {
                model.timestamp = now();
            }

            return {
                perform: function () {
                    return domainObject.useCapability('mutation', setTimestamp)
                        .then(doPersist);
                }
            };
        }

        return AbstractStartTimerAction;
    }
);
