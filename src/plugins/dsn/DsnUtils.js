
define([

], function (

) {
    'use strict';

    /**
     * Converts a domain object's identifier to an object.
     *
     * @param {string} identifier - The identifier to convert.  The namespace and key
     * need to be separated by a colon (eg. 'my.namespace:my.key').
     * @returns {Object} identifier
     */
    function deserializeIdentifier(identifier) {
        var tokens = identifier.split(':');
        return {
            namespace: tokens[0],
            key: tokens[1]
        };
    }

    /**
     * Converts a domain object's identifier to a string, separating the namespace and
     * key with a colon.
     *
     * @param {Object} identifier - The identifier to convert.
     * @returns {string} The identifier as a string (eg. 'my.namespace:my.key').
     */
    function serializeIdentifier(identifier) {
        return identifier.namespace + ':' + identifier.key;
    }

    return {
        deserializeIdentifier: deserializeIdentifier,
        serializeIdentifier: serializeIdentifier
    };
});
