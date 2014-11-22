/*global define,Promise*/

/**
 * Module defining GestureProvider. Created by vwoeltje on 11/22/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function GestureProvider(gestures) {
            var gestureMap = {};

            function releaseGesture(gesture) {
                if (gesture && gesture.destroy) {
                    gesture.destroy();
                }
            }

            function attachGestures(element, domainObject, gestureKeys) {
                var attachedGestures = gestureKeys.map(function (key) {
                    return gestureMap[key];
                }).filter(function (Gesture) {
                    return Gesture !== undefined && (Gesture.appliesTo ?
                            Gesture.appliesTo(domainObject) :
                            true);
                }).map(function (Gesture) {
                    return new Gesture(element, domainObject);
                });

                return {
                    destroy: function () {
                        attachedGestures.forEach(releaseGesture);
                    }
                };
            }

            // Assemble all gestures into a map, for easy look up
            gestures.forEach(function (gesture) {
                gestureMap[gesture.key] = gesture;
            });


            return {
                attachGestures: attachGestures
            };
        }

        return GestureProvider;
    }
);