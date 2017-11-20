
define([

], function (

) {
    'use strict';

    function deserializeIdentifier(identifier) {
        var tokens = identifier.split(':');
        return {
            namespace: tokens[0],
            key: tokens[1]
        };
    }

    function serializeIdentifier(identifier) {
        return identifier.namespace + ':' + identifier.key;
    }

    return {
        deserializeIdentifier: deserializeIdentifier,
        serializeIdentifier: serializeIdentifier
    };
});
