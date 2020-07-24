import objectUtils from 'objectUtils';

function LegacyPersistenceProvider(openmct) {
    this.openmct = openmct;
}

LegacyPersistenceProvider.prototype.listObjects = function () {
    return Promise.resolve([]);
}

LegacyPersistenceProvider.prototype.listSpaces = function () {
    return Promise.resolve(Object.keys(this.openmct.objects.providers));
}

LegacyPersistenceProvider.prototype.updateObject = function (legacyDomainObject) {
    return this.openmct.objects.save(legacyDomainObject.useCapability('adapter'));
}

LegacyPersistenceProvider.prototype.updateObject = function (legacyDomainObject) {
    return this.openmct.objects.save(legacyDomainObject.useCapability('adapter'));
}

LegacyPersistenceProvider.prototype.readObject = function (keystring) {
    let identifier = objectUtils.parseKeyString(keystring);
    return this.openmct.legacyObject(this.openmct.objects.get(identifier));
}

export default LegacyPersistenceProvider;
