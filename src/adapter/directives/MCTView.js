define(['angular'], function (angular) {
    function MCTView(newViews) {
        var factories = {};

        newViews.forEach(function (newView) {
            factories[newView.region] = factories[newView.region] || {};
            factories[newView.region][newView.key] = newView.factory;
        });

        return {
            restrict: 'E',
            link: function (scope, element, attrs) {
                var key, mctObject, region;

                function maybeShow() {
                    if (!factories[region] || !factories[region][key] || !mctObject) {
                        return;
                    }

                    var view = factories[region][key];
                    view.show(element[0], mctObject);
                }

                function setKey(k) {
                    key = k;
                    maybeShow();
                }

                function setObject(obj) {
                    mctObject = obj;
                    maybeShow();
                }

                function setRegion(r) {
                    region = r;
                    maybeShow();
                }

                scope.$watch('key', setKey);
                scope.$watch('region', setRegion);
                scope.$watch('mctObject', setObject);

            },
            scope: {
                key: "=",
                region: "=",
                mctObject: "="
            }
        };
    }

    return MCTView;
});
