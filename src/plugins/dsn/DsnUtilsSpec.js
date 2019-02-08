
define([
    './DsnUtils'
], function (
    DsnUtils
) {
    'use strict';

    describe('DsnUtils', function () {
        it('deserializes a domain object identifier', function () {
            var identifier = DsnUtils.deserializeIdentifier('deep.space.network:canberra');
            expect(identifier.namespace).toBe('deep.space.network');
            expect(identifier.key).toBe('canberra');
        });

        it('serializes a domain object identifier', function () {
            var identifer = DsnUtils.serializeIdentifier({
                namespace: 'deep.space.network',
                key: 'madrid'
            });

            expect(identifer).toBe('deep.space.network:madrid');
        });
    });
});
