define([
    '../object-utils'
],  (objectUtils) => {
    describe('objectUtils', () => {


        describe('keyString util', () => {
            let EXPECTATIONS = {
                'ROOT': {
                    namespace: '',
                    key: 'ROOT'
                },
                'mine': {
                    namespace: '',
                    key: 'mine'
                },
                'extended:something:with:colons': {
                    key: 'something:with:colons',
                    namespace: 'extended'
                },
                'https\\://some/url:resourceId': {
                    key: 'resourceId',
                    namespace: 'https://some/url'
                },
                'scratch:root': {
                    namespace: 'scratch',
                    key: 'root'
                },
                'thingy\\:thing:abc123': {
                    namespace: 'thingy:thing',
                    key: 'abc123'
                }
            };

            Object.keys(EXPECTATIONS).forEach( (keyString) => {
                it('parses "' + keyString + '".', () => {
                    expect(objectUtils.parseKeyString(keyString))
                        .toEqual(EXPECTATIONS[keyString]);
                });

                it('parses and re-encodes "' + keyString + '"', () => {
                    let identifier = objectUtils.parseKeyString(keyString);
                    expect(objectUtils.makeKeyString(identifier))
                        .toEqual(keyString);
                });

                it('is idempotent for "' + keyString + '".', () => {
                    var identifier = objectUtils.parseKeyString(keyString);
                    var again = objectUtils.parseKeyString(identifier);
                    expect(identifier).toEqual(again);
                    again = objectUtils.parseKeyString(again);
                    again = objectUtils.parseKeyString(again);
                    expect(identifier).toEqual(again);

                    var againKeyString = objectUtils.makeKeyString(again);
                    expect(againKeyString).toEqual(keyString);
                    againKeyString = objectUtils.makeKeyString(againKeyString);
                    againKeyString = objectUtils.makeKeyString(againKeyString);
                    againKeyString = objectUtils.makeKeyString(againKeyString);
                    expect(againKeyString).toEqual(keyString);
                });
            });
        });

        describe('old object conversions', () => {

            it('translate ids', () => {
                expect(objectUtils.toNewFormat({
                        prop: 'someValue'
                    }, 'objId'))
                    .toEqual({
                        prop: 'someValue',
                        identifier: {
                            namespace: '',
                            key: 'objId'
                        }
                    });
            });

            it('translates composition', () => {
                expect(objectUtils.toNewFormat({
                        prop: 'someValue',
                        composition: [
                            'anotherObjectId',
                            'scratch:anotherObjectId'
                        ]
                    }, 'objId'))
                    .toEqual({
                        prop: 'someValue',
                        composition: [
                            {
                                namespace: '',
                                key: 'anotherObjectId'
                            },
                            {
                                namespace: 'scratch',
                                key: 'anotherObjectId'
                            }
                        ],
                        identifier: {
                            namespace: '',
                            key: 'objId'
                        }
                    });
            });
        });

        describe('new object conversions', () => {

            it('removes ids', () => {
                expect(objectUtils.toOldFormat({
                        prop: 'someValue',
                        identifier: {
                            namespace: '',
                            key: 'objId'
                        }
                    }))
                    .toEqual({
                        prop: 'someValue'
                    });
            });

            it('translates composition', () => {
                expect(objectUtils.toOldFormat({
                        prop: 'someValue',
                        composition: [
                            {
                                namespace: '',
                                key: 'anotherObjectId'
                            },
                            {
                                namespace: 'scratch',
                                key: 'anotherObjectId'
                            }
                        ],
                        identifier: {
                            namespace: '',
                            key: 'objId'
                        }
                    }))
                    .toEqual({
                        prop: 'someValue',
                        composition: [
                            'anotherObjectId',
                            'scratch:anotherObjectId'
                        ]
                    });
            });
        });
    });
});
