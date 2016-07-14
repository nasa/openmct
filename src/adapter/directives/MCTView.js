define([
    'angular',
    './Region'
], function (angular, Region) {
    function MCTView(newViews) {
        var definitions = {};

        newViews.forEach(function (newView) {
            definitions[newView.region] = definitions[newView.region] || {};
            definitions[newView.region][newView.key] = newView.factory;
        });

        return {
            restrict: 'E',
            link: function (scope, element, attrs) {
                var key, mctObject, regionId, region;

                function maybeShow() {
                    if (!definitions[regionId] || !definitions[regionId][key] || !mctObject) {
                        return;
                    }

                    region.show(definitions[regionId][key].view(mctObject));
                }

                function setKey(k) {
                    key = k;
                    maybeShow();
                }

                function setObject(obj) {
                    mctObject = obj;
                    maybeShow();
                }

                function setRegionId(r) {
                    regionId = r;
                    maybeShow();
                }

                region = new Region(element[0]);

                scope.$watch('key', setKey);
                scope.$watch('region', setRegionId);
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
