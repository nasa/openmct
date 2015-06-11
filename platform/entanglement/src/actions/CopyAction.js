/*global define */
define(
    function () {
        "use strict";

        function CopyAction(locationService, copyService, context) {

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
                        return copyService
                            .perform(object, newParent);
                    }

                    var dialogTitle,
                        label,
                        validateLocation;

                    dialogTitle = [
                        "Duplicate ",
                        object.getModel().name,
                        " to a location"
                    ].join("");

                    label = "Duplicate To";

                    validateLocation = function (newParent) {
                        return copyService
                            .validate(object, newParent);
                    };

                    return locationService.getLocationFromUser(
                        dialogTitle,
                        label,
                        validateLocation,
                        currentParent
                    ).then(function (newParent) {
                        return copyService
                            .perform(object, newParent);
                    });
                }
            };
        }

        return CopyAction;
    }
);
