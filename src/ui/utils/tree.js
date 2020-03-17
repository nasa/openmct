export const getObject = async (openmct, domainObject, identifier) => {
    if (domainObject.identifier.key === identifier.key) {
        return true;
    }

    if (!domainObject.composition) {
        return false;
    }

    let hasObject = false;
    for (const composition of domainObject.composition) {
        hasObject = hasObject
            || await openmct.objects.get(composition)
                .then(object => getObject(openmct, object, identifier));
    }

    return hasObject;
}

export const searchObjectInTree = async (openmct, identifier) => {
    return await openmct.objects.get('ROOT')
        .then(root => openmct.composition.get(root).load())
        .then(composition => {
            let hasObject = false;
            composition.forEach(domainObject => {
                hasObject = hasObject || getObject(openmct, domainObject, identifier);
            });

            return hasObject;
        });
};
