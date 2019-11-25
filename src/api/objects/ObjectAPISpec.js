/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2019, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define([
    './ObjectAPI'
], function (
    ObjectAPI
) {
    fdescribe('The Object API', function () {
        describe('Mutable Object', function () {
            let testObject;
            let mutable;
            let objectAPI;

            beforeEach(function () {
                objectAPI = new ObjectAPI();
                testObject = {
                    identifier: {
                        namespace: 'test-namespace',
                        key: 'test-key'
                    },
                    otherAttribute: 'other-attribute-value',
                    objectAttribute: {
                        embeddedObject: {
                            embeddedKey: 'embedded-value'
                        }
                    }
                };
                mutable = objectAPI.mutable(testObject);
            });

            it('retains own properties', function () {
                expect(mutable.hasOwnProperty('identifier')).toBe(true);
                expect(mutable.hasOwnProperty('otherAttribute')).toBe(true);
                expect(mutable.identifier).toEqual(testObject.identifier);
                expect(mutable.otherAttribute).toEqual(testObject.otherAttribute);
            });

            it('is identical to original object when serialized', function () {
                expect(JSON.stringify(mutable)).toEqual(JSON.stringify(testObject));
            });

            it('is identical to original object when serialized', function () {
                expect(JSON.stringify(mutable)).toEqual(JSON.stringify(testObject));
            });

            describe('uses events', function () {
                let testObjectDuplicate;
                let mutableSecondInstance;

                beforeEach(function () {
                    // Duplicate object to guarantee we are not sharing object instance, which would invalidate test
                    testObjectDuplicate = JSON.parse(JSON.stringify(testObject));
                    mutableSecondInstance = objectAPI.mutable(testObjectDuplicate);
                });

                it('to stay synchronized when mutated', function () {
                    mutable.$set('otherAttribute', 'new-attribute-value');
                    expect(mutableSecondInstance.otherAttribute).toBe('new-attribute-value');
                });

                it('to indicate when a property changes', function () {
                    let mutationCallback = jasmine.createSpy('mutation-callback');

                    return new Promise(function (resolve) {
                        mutationCallback.and.callFake(resolve);
                        mutableSecondInstance.observe('otherAttribute', mutationCallback);
                        mutable.$set('otherAttribute', 'some-new-value')
                    }).then(function () {
                        expect(mutationCallback).toHaveBeenCalledWith('some-new-value');
                    });
                });

                it('to indicate when a child property has changed', function () {
                    let embeddedKeyCallback = jasmine.createSpy('embeddedKeyCallback');
                    let embeddedObjectCallback = jasmine.createSpy('embeddedObjectCallback');
                    let objectAttributeCallback = jasmine.createSpy('objectAttribute');

                    return new Promise(function (resolve) {
                        objectAttributeCallback.and.callFake(resolve);

                        mutableSecondInstance.observe('objectAttribute.embeddedObject.embeddedKey', embeddedKeyCallback);
                        mutableSecondInstance.observe('objectAttribute.embeddedObject', embeddedObjectCallback);
                        mutableSecondInstance.observe('objectAttribute', objectAttributeCallback);

                        mutable.$set('objectAttribute.embeddedObject.embeddedKey', 'updated-embedded-value');
                    }).then(function () {
                        expect(embeddedKeyCallback).toHaveBeenCalledWith('updated-embedded-value');
                        expect(embeddedObjectCallback).toHaveBeenCalledWith({
                            embeddedKey: 'updated-embedded-value'
                        });
                        expect(objectAttributeCallback).toHaveBeenCalledWith({
                            embeddedObject: {
                                embeddedKey: 'updated-embedded-value'
                            }
                        });
                    });
                });
            });
        });
    })
});
