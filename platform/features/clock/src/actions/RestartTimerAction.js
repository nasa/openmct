/*global define*/

define(
    ['./AbstractStartTimerAction'],
    function (AbstractStartTimerAction) {
        "use strict";

        /**
         * Implements the "Restart at 0" action.
         *
         * Behaves the same as (and delegates functionality to)
         * the "Start" action.
         * @implements Action
         */
        function RestartTimerAction(now, context) {
            return new AbstractStartTimerAction(now, context);
        }

        RestartTimerAction.appliesTo = function (context) {
            var model =
                (context.domainObject && context.domainObject.getModel())
                || {};

            // We show this variant for timers which already have
            // a target time.
            return model.type === 'timer' &&
                    model.timestamp !== undefined;
        };

        return RestartTimerAction;

    }
);
