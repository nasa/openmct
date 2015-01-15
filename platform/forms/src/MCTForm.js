/*global define,Promise*/

/**
 * Module defining MCTForm. Created by vwoeltje on 11/10/14.
 */
define(
    ["./controllers/FormController"],
    function (FormController) {
        "use strict";

        /**
         * The mct-form directive allows generation of displayable
         * forms based on a declarative description of the form's
         * structure.
         *
         * This directive accepts three attributes:
         *
         * * `ng-model`: The model for the form; where user input
         *   where be stored.
         * * `structure`: The declarative structure of the form.
         *   Describes what controls should be shown and where
         *   their values should be read/written in the model.
         * * `name`: The name under which to expose the form's
         *   dirty/valid state. This is similar to ng-form's use
         *   of name, except this will be made available in the
         *   parent scope.
         *
         * @constructor
         */
        function MCTForm() {
            var templatePath = [
                "platform/forms", //MCTForm.bundle.path,
                "res", //MCTForm.bundle.resources,
                "templates/form.html"
            ].join("/");

            return {
                // Only show at the element level
                restrict: "E",

                // Load the forms template
                templateUrl: templatePath,

                // Use FormController to populate/respond to changes in scope
                controller: FormController,

                // Initial an isolate scope
                scope: {

                    // The model: Where form input will actually go
                    ngModel: "=",

                    // Form structure; what sections/rows to show
                    structure: "=",

                    // Name under which to publish the form
                    name: "@"
                }
            };
        }

        return MCTForm;
    }
);