/*global define,Promise*/

/**
 * Module defining MCTForm. Created by vwoeltje on 11/10/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
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
                restrict: "E",
                templateUrl: templatePath,
                scope: { structure: "=", model: "=ngModel" }
            };
        }

        return MCTForm;
    }
);