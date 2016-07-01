define([

], function (

) {

    // take a key string and turn it into a key object
    // 'scratch:root' ==> {namespace: 'scratch', identifier: 'root'}
    var parseKeyString = function (key) {
        if (typeof key === 'object') {
            return key;
        }
        var namespace = '',
            identifier = key;
        for (var i = 0, escaped = false, len=key.length; i < len; i++) {
            if (key[i] === ":" && !escaped) {
                namespace = key.slice(0, i);
                identifier = key.slice(i + 1);
                break;
            }
        }
        return {
            namespace: namespace,
            identifier: identifier
        };
    };

    // take a key and turn it into a key string
    // {namespace: 'scratch', identifier: 'root'} ==> 'scratch:root'
    var makeKeyString = function (key) {
        if (typeof key === 'string') {
            return key;
        }
        if (!key.namespace) {
            return key.identifier;
        }
        return [
            key.namespace.replace(':', '\\:'),
            key.identifier.replace(':', '\\:')
        ].join(':');
    };

    // Converts composition to use key strings instead of keys
    var toOldFormat = function (model) {
        delete model.key;
        if (model.composition) {
            model.composition = model.composition.map(makeKeyString);
        }
        return model;
    };

    // converts composition to use keys instead of key strings
    var toNewFormat = function (model, key) {
        model.key = key;
        if (model.composition) {
            model.composition = model.composition.map(parseKeyString);
        }
        return model;
    };

    return {
        toOldFormat: toOldFormat,
        toNewFormat: toNewFormat,
        makeKeyString: makeKeyString,
        parseKeyString: parseKeyString
    };
});
