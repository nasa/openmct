define(function () {
    function MCTGesture(gestureService){
        return {
            restrict : 'A',
            link : function($scope, $element, attrs){
                gestureService.attachGestures(
                    $element,
                    $scope.composition.asDomainObject,
                    attrs.mctGesture.split(",")
                )
            }
        }
    }
    return MCTGesture
})
