define([
    './imageryViewProvider',
], function (
    ImageryViewProvider
) {
    return function plugin() {
        return function install(openmct) {
            openmct.objectViews.addProvider(new ImageryViewProvider(openmct));
        };
    };
});