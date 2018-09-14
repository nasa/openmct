define([

], function (

) {
    function RegisterLegacyTypes(types, openmct) {
        types.forEach(function (legacyDefinition) {
            if (!openmct.types.get(legacyDefinition.key)) {
                console.warn(`DEPRECATION WARNING: Migrate type ${legacyDefinition.key} from ${legacyDefinition.bundle.path} to use the new Types API.  Legacy type support will be removed soon.`);
            }
        });

        openmct.types.importLegacyTypes(types);
    }

    return RegisterLegacyTypes;
});
