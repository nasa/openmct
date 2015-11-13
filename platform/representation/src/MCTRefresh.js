/*global define*/
define(
    [],
    function () {
        'use strict';

        function MCTRefresh() {

            function link(scope, elem, attrs, ctrl, transclude) {
                var domainObject = scope.$eval(attrs.mctRefresh),
                    mutation = domainObject.getCapability('mutation'),
                    unlisten;

                function recreateContents() {
                    transclude(function (clone) {
                        elem.empty();
                        elem.append(clone);
                    });
                }

                recreateContents();
                unlisten = mutation.listen(recreateContents);
                scope.$on("$destroy", unlisten);
            }

            return {
                transclude: true,
                link: link
            };
        }

        return MCTRefresh;
    }
);
