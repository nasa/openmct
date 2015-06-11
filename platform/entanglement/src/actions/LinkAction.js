/*global define */
define(
    function () {
        "use strict";

        function LinkAction(locationService, linkService, context) {

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
                        return linkService
                            .perform(object, newParent);
                    }
                    var dialogTitle,
                        label,
                        validateLocation;

                    dialogTitle = [
                        "Link ",
                        object.getModel().name,
                        " to a new location"
                    ].join("");

                    label = "Link To";

                    validateLocation = function (newParent) {
                        return linkService
                            .validate(object, newParent);
                    };

                    return locationService.getLocationFromUser(
                        dialogTitle,
                        label,
                        validateLocation,
                        currentParent
                    ).then(function (newParent) {
                        return linkService
                            .perform(object, newParent);
                    });
                }
            };
        }

        return LinkAction;
    }
);
