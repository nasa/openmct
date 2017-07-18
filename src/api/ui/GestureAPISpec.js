/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    './GestureAPI',
    '../objects/object-utils'
], function (
    GestureAPI,
    objectUtils
) {
    describe('The Gesture API', function () {
        var api, openmct;
        beforeEach(function () {
            openmct = jasmine.createSpyObj('openmct', ['$injector']);
            var gestureService = jasmine.createSpyObj('gestureService', ['attachGestures']);
            gestureService.attachGestures.andCallFake(function (arg1,arg2,arg3) {
                var destroyFunction = jasmine.createSpy('destroyFunction');
                return destroyFunction;
            });
            var instantiateFunction = jasmine.createSpy('instantiateFunction');
            instantiateFunction.andCallFake(function (arg1,arg2) {
                return arg1;
            });
            var $injector = jasmine.createSpyObj('$injector', ['get']);
            $injector.get.andCallFake(function (arg) {
                if (arg === "gestureService") {
                    return gestureService;
                }
                if (arg === "instantiate") {
                    return instantiateFunction;
                }
            });
            openmct.$injector = $injector;

            api = new GestureAPI(openmct, objectUtils);
        });
        it('attaches a contextmenu to an element and returns a destroy function', function () {
            var htmlElement = document.createElement('div');
            htmlElement.appendChild(document.createTextNode('test element'));

            var nChildDomainObject = jasmine.createSpyObj('nChildDomainObject', ['identifier']);
            nChildDomainObject.identifier = '555S';

            var nParentDomainObject = jasmine.createSpyObj('nParentDomainObject', ['identifier']);
            nParentDomainObject.identifier = '555P';

            var destroyFunc = api.contextMenu(htmlElement, nChildDomainObject, nParentDomainObject);
            expect(destroyFunc).toBeDefined();
        });
        it('attaches a infomenu to an element and returns a destroy function', function () {
            var htmlElement = document.createElement('div');
            htmlElement.appendChild(document.createTextNode('test element'));

            var nChildDomainObject = jasmine.createSpyObj('nChildDomainObject', ['identifier']);
            nChildDomainObject.identifier = '555S';

            var nParentDomainObject = jasmine.createSpyObj('nParentDomainObject', ['identifier']);
            nParentDomainObject.identifier = '555P';

            var destroyFunc = api.info(htmlElement, nChildDomainObject, nParentDomainObject);
            expect(destroyFunc).toBeDefined();
        });
        it('converts a new domain object to an old one and instantiates it', function () {
            var nDomainObject = jasmine.createSpyObj('nDomainObject', ['identifier']);
            var oDomainObject = api.convertAndInstantiateDomainObject(nDomainObject);
            expect(oDomainObject).toBeDefined();

        });

    });
});
