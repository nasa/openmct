define(function () {
    function MCTGesture(gestureService) {
        return {
            restrict : 'A',
            scope: {
                domainObject: '=mctObject'
            },
            link : function ($scope, $element, attrs) {
                var activeGestures = gestureService.attachGestures(
                    $element,
                    $scope.domainObject,
                    attrs.mctGesture.split(",")
                );
                $scope.$on('$destroy', function () {
                    activeGestures.destroy();
                    delete this.activeGestures;
                });
            }
        };
    }
    return MCTGesture;
});
