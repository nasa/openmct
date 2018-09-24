define([
    './LegacyViewProvider',
    '../../api/objects/object-utils'
], function (
    LegacyViewProvider,
    objectUtils
) {
    function installLegacyViews(openmct, legacyViews, instantiate) {

        function convertToLegacyObject(domainObject) {
            let keyString = objectUtils.makeKeyString(domainObject.identifier);
            let oldModel = objectUtils.toOldFormat(domainObject);
            return instantiate(oldModel, keyString);
        }

        legacyViews.forEach(function (legacyView) {
            openmct.objectViews.addProvider(new LegacyViewProvider(legacyView, openmct, convertToLegacyObject));
        });
    }

    return installLegacyViews;
});
