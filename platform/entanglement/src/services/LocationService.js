/*global define */

define(
    function () {
        "use strict";

        /**
         * The LocationService allows for easily prompting the user for a
         * location in the root tree.
        */
        function LocationService(dialogService) {
            return {
                /** Prompt the user to select a location.  Returns a promise
                 * that is resolved with a domainObject representing the
                 * location selected by the user.
                 *
                 * @param {string} title - title of location dialog
                 * @param {string} label - label for location input field
                 * @param {function} validate - function that validates
                 *     selections.
                 * @param {domainObject} initialLocation - tree location to
                 *     display at start
                 * @returns {Promise} promise for a domain object.
                 */
                getLocationFromUser: function (title, label, validate, initialLocation) {
                    var formStructure,
                        formState;

                    formStructure = {
                        sections: [
                            {
                                name: 'Location',
                                rows: [
                                    {
                                        name: label,
                                        control: "locator",
                                        validate: validate,
                                        key: 'location'
                                    }
                                ]
                            }
                        ],
                        name: title
                    };

                    formState = {
                        location: initialLocation
                    };

                    return dialogService
                        .getUserInput(formStructure, formState)
                        .then(function (formState) {
                            return formState.location;
                        });
                }
            };
        }

        return LocationService;
    }
);
