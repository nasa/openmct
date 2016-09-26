define([], function () {

    function toLegacyIdentifier(identifier) {
        return [identifier.namespace, identifier.key]
            .map(function (part) {
                return part.replace(':', '\\:');
            }).join(":");
    }

    function fromLegacyIdentifier(id) {
        var namespace = '',
            identifier = key;

        for (var i = 0, escaped = false, len=key.length; i < key.length; i++) {
            if (escaped) {
                escaped = false;
            } else {
                if (key[i] === "\\") {
                    escaped = true;
                    continue;
                }
                if (key[i] === ":") {
                    // namespace = key.slice(0, i);
                    identifier = key.slice(i + 1);
                    break;
                }
            }
            namespace += key[i];
        }

        if (key === namespace) {
            namespace = '';
        }

        return {
            namespace: namespace,
            identifier: identifier
        };
    }

    function DomainObjectConverter(instantiate) {
        this.instantiate = instantiate;
    }

    DomainObjectConverter.prototype.toLegacyDomainObject = function (domainObject) {
        var model = JSON.parse(JSON.stringify(domainObject));
        var id = toLegacyIdentifier(domainObject.identifier);
        delete model.identifier;

        if (model.composition) {
            model.composition = model.composition.map(toLegacyIdentifier);
        }

        return this.instantiate(model, id);
    };

    DomainObjectConverter.prototype.fromLegacyDomainObject = function (domainObject) {
        var newObject = JSON.parse(JSON.stringify(domainObject.getModel()));
        newObject.identifier = fromLegacyIdentifier(domainObject.getId());
        if (newObject.composition) {
            newObject.composition =
                newObject.composition.map(fromLegacyIdentifier);
        }
        return newObject;
    };

    return DomainObjectConverter;
});
