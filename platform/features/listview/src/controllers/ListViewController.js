define(function () {
    function ListViewController($scope) {
        this.$scope = $scope;
        $scope.orderByField = 'title';
        $scope.reverseSort = false;

        this.updateView();
        var unlisten = $scope.domainObject.getCapability('mutation')
            .listen(this.updateView.bind(this));

        $scope.$on('$destroy', function () {
            unlisten();
        });

    }
    ListViewController.prototype.updateView = function () {
        this.$scope.domainObject.useCapability('composition')
            .then(function (children) {
                var formattedChildren = this.formatChildren(children);
                this.$scope.children = formattedChildren;
                this.$scope.data = {children: formattedChildren};
            }.bind(this)
        );
    };
    ListViewController.prototype.formatChildren = function (children) {
        return children.map(function (child) {
            return {
                icon: child.getCapability('type').getCssClass(),
                title: child.getModel().name,
                type: child.getCapability('type').getName(),
                persisted: new Date(
                    child.getModel().persisted
                ).toUTCString(),
                modified: new Date(
                    child.getModel().modified
                ).toUTCString(),
                asDomainObject: child
            };
        });
    };

    return ListViewController;
});
