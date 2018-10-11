/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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
    '../src/MCTTriggerModal'
], function (
    MCTTriggerModal
) {
    describe('MCTTriggerModal', function () {
        var $scope,
            $element,
            frame,
            layoutContainer,
            $document,
            mctTriggerModal;

        function makeElement(classes, parentEl) {
            var elem = jasmine.createSpyObj('element.' + classes.join('.'), [
                'hasClass',
                'parent'
            ]);
            elem.hasClass.and.callFake(function (className) {
                return classes.indexOf(className) !== -1;
            });
            elem.parent.and.returnValue(parentEl);
            var div = document.createElement('div');
            div.className = classes.join(' ');
            parentEl[0].appendChild(div);
            elem[0] = div;
            return elem;
        }


        beforeEach(function () {
            $scope = jasmine.createSpyObj('$scope', ['$on']);
            $scope.domainObject = { getCapability: function () {
                return { getActions: function () {
                    return [];
                }};
            }};

            $element = jasmine.createSpyObj('$element', [
                'parent',
                'remove',
                'on',
                'off'
            ]);
            layoutContainer = document.createElement('div');
            frame = makeElement(['frame'], [layoutContainer]);
            var child = makeElement([], frame);
            for (var i = 0; i < 5; i++) {
                child = makeElement([], child);
            }
            $element.parent.and.returnValue(child);
            $document = [jasmine.createSpyObj('document', ['createElement'])];
            $document[0].body = document.createElement('div');
            $document[0].createElement.and.callFake(function (tag) {
                return document.createElement(tag);
            });

            mctTriggerModal = new MCTTriggerModal($document);
        });

        it('is a directive definition', function () {
            expect(mctTriggerModal.restrict).toBe('A');
            expect(mctTriggerModal.link).toEqual(jasmine.any(Function));
        });

        describe('link', function () {
            beforeEach(function () {
                mctTriggerModal.link($scope, $element);
            });

            it('attaches handlers to $element', function () {
                expect($element.on).toHaveBeenCalledWith(
                    'click',
                    jasmine.any(Function)
                );
            });

            it('cleans up on $scope $destroy', function () {
                expect($scope.$on).toHaveBeenCalledWith(
                    '$destroy',
                    jasmine.any(Function)
                );
                $scope.$on.calls.mostRecent().args[1]();
                expect($element.off).toHaveBeenCalledWith(
                    'click',
                    jasmine.any(Function)
                );
            });

            it('opens and closes overlays', function () {
                [
                    'a.close', 'a.t-done', '.abs.blocker'
                ].forEach(function (selector) {
                    $element.on.calls.mostRecent().args[1]();
                    var container = $document[0].body.querySelector('.t-contents');
                    expect(container.children[0]).toBe(frame[0]);
                    expect(layoutContainer.children[0]).not.toBe(frame[0]);
                    $document[0].body.querySelector(selector)
                        .dispatchEvent(new Event('click'));
                    expect(container.children[0]).not.toBe(frame[0]);
                    expect(layoutContainer.children[0]).toBe(frame[0]);
                });
            });
        });
    });
});
