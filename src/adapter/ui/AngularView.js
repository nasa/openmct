define(['angular'], function (angular) {
    function AngularView(template) {
        this.template = template;
    }

    AngularView.prototype.show = function (container) {
        if (this.activeScope) {
            this.destroy();
        }

        var $injector = angular.injector(['ng']);
        var $compile = $injector.get('$compile');
        var $rootScope = $injector.get('$rootScope');
        var $scope = $rootScope.$new();
        var elements = $compile(this.template)($scope);

        angular.element(container).append(elements);
    };

    AngularView.prototype.destroy = function () {
        if (this.activeScope) {
            this.activeScope.$destroy();
            this.activeScope = undefined;
        }
    };

    return AngularView;
});
