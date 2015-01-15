/*global define*/

define(
    ["angular"],
    function (angular) {
        "use strict";

        function StyleSheetLoader(stylesheets, $document) {
            var head = $document.find('head');

            function addStyleSheet(stylesheet) {
                var link = angular.element('<link>'),
                    path = [
                        stylesheet.bundle.path,
                        stylesheet.bundle.resources,
                        stylesheet.stylesheetUrl
                    ].join("/");

                link.attr("rel", "stylesheet");
                link.attr("type", "text/css");
                link.attr("href", path);

                head.append(link);
            }

            stylesheets.forEach(addStyleSheet);
        }

        return StyleSheetLoader;
    }
);