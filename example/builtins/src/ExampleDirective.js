/*global define,Promise*/

/**
 * Module defining ExampleDirective. Created by vwoeltje on 11/4/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         *
         * @constructor
         */
        function ExampleDirective(examples) {
            // Build up a template from example extensions
            var template = examples.length > 0 ?
                    "A directive loaded these example extensions:<ul>" :
                    "This came from a directive.<ul>";

            examples.forEach(function (e) {
                template += "<li>" + e.text + "</li>";
            });
            template += "</ul>";

            return {
                template: template
            };
        }

        return ExampleDirective;
    }
);