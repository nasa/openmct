/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(['./MutableObject'], function (MutableObject) {
    describe('Mutable Domain Objects', function () {
        var domainObject,
            mutableObject,
            eventEmitter,
            arrayProperty,
            objectProperty,
            identifier;

        beforeEach(function () {
            identifier = 'objectId';
            arrayProperty = [
                'First array element',
                'Second array element',
                'Third array element'
            ];
            objectProperty = {
                prop1: 'val1',
                prop2: 'val2',
                prop3: {
                    propA: 'valA',
                    propB: 'valB',
                    propC: []
                }
            };
            domainObject = {
                    key: {
                        identifier: identifier
                    },
                    stringProperty: 'stringValue',
                    objectProperty: objectProperty,
                    arrayProperty: arrayProperty
                };
            eventEmitter = jasmine.createSpyObj('eventEmitter', [
                'emit'
            ]);
            mutableObject = new MutableObject(eventEmitter, domainObject);
        });

        it('Supports getting and setting of object properties', function () {
            expect(mutableObject.get('stringProperty')).toEqual('stringValue');
            mutableObject.set('stringProperty', 'updated');
            expect(mutableObject.get('stringProperty')).toEqual('updated');

            var newArrayProperty = [];
            expect(mutableObject.get('arrayProperty')).toEqual(arrayProperty);
            mutableObject.set('arrayProperty', newArrayProperty);
            expect(mutableObject.get('arrayProperty')).toEqual(newArrayProperty);

            var newObjectProperty = [];
            expect(mutableObject.get('objectProperty')).toEqual(objectProperty);
            mutableObject.set('objectProperty', newObjectProperty);
            expect(mutableObject.get('objectProperty')).toEqual(newObjectProperty);
        });

        it('Supports getting and setting of nested properties', function () {
            expect(mutableObject.get('objectProperty')).toEqual(objectProperty);
            expect(mutableObject.get('objectProperty.prop1')).toEqual(objectProperty.prop1);
            expect(mutableObject.get('objectProperty.prop3.propA')).toEqual(objectProperty.prop3.propA);

            mutableObject.set('objectProperty.prop1', 'new-prop-1');
            expect(domainObject.objectProperty.prop1).toEqual('new-prop-1');

            mutableObject.set('objectProperty.prop3.propA', 'new-prop-A');
            expect(domainObject.objectProperty.prop3.propA).toEqual('new-prop-A');

            mutableObject.set('arrayProperty.1', 'New Second Array Element');
            expect(arrayProperty[1]).toEqual('New Second Array Element');
        });

        it('Fires events when properties change', function () {
            var newString = 'updated'
            mutableObject.set('stringProperty', newString);
            expect(eventEmitter.emit).toHaveBeenCalledWith([identifier, 'stringProperty'].join(':'), newString);

            var newArray = [];
            mutableObject.set('arrayProperty', newArray);
            expect(eventEmitter.emit).toHaveBeenCalledWith([identifier, 'arrayProperty'].join(':'), newArray);

        });

        it('Fires wildcard event when any property changes', function () {
            var newString = 'updated'
            mutableObject.set('objectProperty.prop3.propA', newString);
            expect(eventEmitter.emit).toHaveBeenCalledWith([identifier, '*'].join(':'), domainObject);
        });
    });
});
