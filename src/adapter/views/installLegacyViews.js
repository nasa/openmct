define([
    './LegacyViewProvider',
    './TypeInspectorViewProvider',
    'objectUtils'
], function (
    LegacyViewProvider,
    TypeInspectorViewProvider,
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

        let inspectorTypes = openmct.$injector.get('types[]')
            .filter((t) => Object.prototype.hasOwnProperty.call(t, 'inspector'));

        inspectorTypes.forEach(function (typeDefinition) {
            openmct.inspectorViews.addProvider(new TypeInspectorViewProvider(typeDefinition, openmct, convertToLegacyObject));
        });
    }

    return installLegacyViews;
});
