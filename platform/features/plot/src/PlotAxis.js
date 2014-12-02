/*global define*/

define(
    [],
    function () {
        "use strict";

        function PlotAxis(axisType, metadatas, defaultValue) {
            var keys = {},
                options = [];

            function buildOptionsForMetadata(m) {
                (m[axisType] || []).forEach(function (option) {
                    if (!keys[option.key]) {
                        keys[option.key] = true;
                        options.push(option);
                    }
                });
            }

            (metadatas || []).forEach(buildOptionsForMetadata);

            // Plot axis will be used directly from the Angular
            // template, so expose properties directly to facilitate
            // two-way data binding (for drop-down menus)
            return {
                options: options,
                active: options[0] || defaultValue
            };
        }

        return PlotAxis;

    }
);