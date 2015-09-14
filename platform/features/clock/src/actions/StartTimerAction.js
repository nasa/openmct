/*global define*/

define(
    ['./AbstractStartTimerAction'],
    function (AbstractStartTimerAction) {
        "use strict";

        /**
         * Implements the "Start" action for timers.
         *
         * Sets the reference timestamp in a timer to the current
         * time, such that it begins counting up.
         *
         * @implements Action
         */
        function StartTimerAction(now, context) {
            return new AbstractStartTimerAction(now, context);
        }

        StartTimerAction.appliesTo = function (context) {
            var model =
                (context.domainObject && context.domainObject.getModel())
                || {};

            // We show this variant for timers which do not yet have
            // a target time.
            return model.type === 'warp.timer' &&
                    model.timestamp === undefined;
        };

        return StartTimerAction;

    }
);