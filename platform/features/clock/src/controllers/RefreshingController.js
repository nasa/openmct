/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Continually refreshes the represented domain object.
         *
         * This is a short-term workaround to assure Timer views stay
         * up-to-date; should be replaced by a global auto-refresh.
         */
        function RefreshingController($scope, tickerService) {
            var unlisten;

            function triggerRefresh() {
                var persistence = $scope.domainObject &&
                    $scope.domainObject.getCapability('persistence');
                return persistence && persistence.refresh();
            }

            unlisten = tickerService.listen(triggerRefresh);
            $scope.$on('$destroy', unlisten);
        }

        return RefreshingController;
    }
);
