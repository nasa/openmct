/*global define,Promise*/

/**
 * Module defining ExampleDirective. Created by vwoeltje on 11/4/14.
 */
define(
    [],
    function () {
        "use strict";

        var HAS_EXTENSIONS = "A directive loaded these example extensions.",
            NO_EXTENSIONS = "A directive tried to load example extensions," +
                    " but found none.";

        /**
         *
         * @constructor
         */
        function ExampleDirective(examples) {
            // Build up a template from example extensions
            var template = examples.length > 0 ?
                    HAS_EXTENSIONS : NO_EXTENSIONS;

            template += "<ul>"
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