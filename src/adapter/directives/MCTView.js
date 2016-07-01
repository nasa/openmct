define(['angular'], function (angular) {
    function MCTView(newViews) {
        var factories = {};

        newViews.forEach(function (newView) {
            factories[newView.key] = newView.factory;
        });

        return {
            restrict: 'E',
            link: function (scope, element, attrs) {
                var key = undefined;
                var mctObject = undefined;

                function maybeShow() {
                    if (!factories[key]) {
                        return;
                    }
                    if (!mctObject) {
                        return;
                    }

                    var view = factories[key](mctObject);
                    view.show(element[0]);
                }

                function setKey(k) {
                    key = k;
                    maybeShow();
                }

                function setObject(obj) {
                    mctObject = obj;
                    maybeShow();
                }

                scope.$watch('key', setKey);
                scope.$watch('mctObject', setObject);

            },
            scope: {
                key: "=",
                mctObject: "="
            }
        };
    }

    return MCTView;
});
