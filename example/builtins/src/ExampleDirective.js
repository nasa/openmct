/*global define,Promise*/

/**
 * Module defining ExampleDirective. Created by vwoeltje on 11/4/14.
 */
define(
    [],
    function () {
        "use strict";

        var HAS_EXTENSIONS = "A directive loaded these message from " +
                    "example extensions.",
            NO_EXTENSIONS = "A directive tried to load example extensions," +
                    " but found none.",
            MESSAGE = "I heard this from my partial constructor.";

        /**
         *
         * @constructor
         */
        function ExampleDirective(examples) {
            // Build up a template from example extensions
            var template = examples.length > 0 ?
                    HAS_EXTENSIONS : NO_EXTENSIONS;

            template += "<ul>";
            examples.forEach(function (E) {
                template += "<li>";
                if (typeof E === 'function') {
                    template += (new E(MESSAGE)).getText();
                } else {
                    template += E.text;
                }
                template += "</li>";
            });
            template += "</ul>";

            return {
                template: template
            };
        }

        return ExampleDirective;
    }
);