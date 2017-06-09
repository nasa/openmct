define(function () {
    function MCTGesture(gestureService) {
        return {
            restrict : 'A',
            scope: {
                domainObject: '=mctObject'
            },
            link : function ($scope, $element, attrs) {
                this.activeGestures = gestureService.attachGestures(
                    $element,
                    $scope.domainObject,
                    attrs.mctGesture.split(",")
                );
                $scope.$on('$destroy', function () {
                    this.activeGestures.destroy();
                    delete this.activeGestures;
                });
            }
        };
    }
    return MCTGesture;
});
