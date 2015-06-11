/*global define */
define(
    function () {
        "use strict";

        function MoveAction(locationService, moveService, context) {

            var object,
                newParent,
                currentParent;

            if (context.selectedObject) {
                newParent = context.domainObject;
                object = context.selectedObject;
            } else {
                object = context.domainObject;
            }

            currentParent = object
                .getCapability('context')
                .getParent();

            return {
                perform: function () {
                    if (newParent) {
                        return moveService
                            .perform(object, newParent);
                    }

                    var dialogTitle,
                        label,
                        validateLocation;

                    dialogTitle = [
                        "Move ",
                        object.getModel().name,
                        " to a new location"
                    ].join("");

                    label = "Move To";

                    validateLocation = function (newParent) {
                        return moveService
                            .validate(object, newParent);
                    };

                    return locationService.getLocationFromUser(
                        dialogTitle,
                        label,
                        validateLocation,
                        currentParent
                    ).then(function (newParent) {
                        return moveService
                            .perform(object, newParent);
                    });
                }
            };
        }

        return MoveAction;
    }
);
