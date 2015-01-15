/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * The StyleSheetLoader adds links to style sheets exposed from
         * various bundles as extensions of category `stylesheets`.
         * @constructor
         * @param {object[]} stylesheets stylesheet extension definitions
         * @param $document Angular's jqLite-wrapped document element
         */
        function StyleSheetLoader(stylesheets, $document) {
            var head = $document.find('head'),
                document = $document[0];

            // Procedure for adding a single stylesheet
            function addStyleSheet(stylesheet) {
                // Create a link element, and construct full path
                var link = document.createElement('link'),
                    path = [
                        stylesheet.bundle.path,
                        stylesheet.bundle.resources,
                        stylesheet.stylesheetUrl
                    ].join("/");

                // Initialize attributes on the link
                link.setAttribute("rel", "stylesheet");
                link.setAttribute("type", "text/css");
                link.setAttribute("href", path);

                // Append the link to the head element
                head.append(link);
            }

            // Add all stylesheets from extensions
            stylesheets.forEach(addStyleSheet);
        }

        return StyleSheetLoader;
    }
);