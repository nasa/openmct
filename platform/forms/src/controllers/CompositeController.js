/*global define*/

define(
    [],
    function () {
        "use strict";

        function CompositeController() {
            function isDefined(element) {
                return typeof element !== 'undefined';
            }

            function or(a, b) {
                return a || b;
            }

            return {
                isNonEmpty: function (value) {
                    return (value || []).map(isDefined).reduce(or, false);
                }
            };
        }

        return CompositeController;

    }
);