/*global define*/
define(
    [],
    function () {
        'use strict';

        function MCTObserve(throttle) {

            function link(scope, elem, attrs, ctrl, transclude) {
                var unobserveFns = [],
                    unwatch,
                    scheduleRecreate;

                function stopObserving() {
                    unobserveFns.forEach(function (unobserve) {
                        unobserve();
                    });
                    unobserveFns = [];
                }

                function recreateContents() {
                    transclude(function (clone) {
                        elem.empty();
                        elem.append(clone);
                    });
                }

                //recreateContents();
                scheduleRecreate = throttle(recreateContents, 0);

                unwatch = scope.$parent.$watch(attrs.mctObserve, function (observable) {
                    stopObserving();
                    unobserveFns = [observable.observe(scheduleRecreate)];
                });

                scope.$on('$destroy', function () {
                    stopObserving();
                    unwatch();
                });
            }

            return {
                restrict: 'A',
                transclude: true,
                link: link,
                scope: true
            };
        }

        return MCTObserve;
    }
);
