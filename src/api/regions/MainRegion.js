define([
    '../Region'
], function (Region) {
    function MainRegion(element) {
        Region.call(this, element);
    }

    MainRegion.prototype = Region.prototype;

    return MainRegion;
});
