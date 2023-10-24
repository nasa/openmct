/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
import { toggleClass } from '@/utils/template/templateHelpers';

const CLASS_AS_NON_EMPTY_STRING = 'class-to-toggle';
const CLASS_AS_EMPTY_STRING = '';
const CLASS_DEFAULT = CLASS_AS_NON_EMPTY_STRING;
const CLASS_SECONDARY = 'another-class-to-toggle';
const CLASS_TERTIARY = 'yet-another-class-to-toggle';

const CLASS_TO_TOGGLE = CLASS_DEFAULT;

describe('toggleClass', () => {
  describe('type checking', () => {
    const A_DOM_NODE = document.createElement('div');
    const NOT_A_DOM_NODE = 'not-a-dom-node';
    describe('errors', () => {
      it('throws when "className" is an empty string', () => {
        expect(() => toggleClass(A_DOM_NODE, CLASS_AS_EMPTY_STRING)).toThrow();
      });
      it('throws when "element" is not a DOM node', () => {
        expect(() => toggleClass(NOT_A_DOM_NODE, CLASS_DEFAULT)).toThrow();
      });
    });
    describe('success', () => {
      it('does not throw when "className" is not an empty string', () => {
        expect(() => toggleClass(A_DOM_NODE, CLASS_AS_NON_EMPTY_STRING)).not.toThrow();
      });
      it('does not throw when "element" is a DOM node', () => {
        expect(() => toggleClass(A_DOM_NODE, CLASS_DEFAULT)).not.toThrow();
      });
    });
  });
  describe('adding a class', () => {
    it('adds specified class to an element without any classes', () => {
      // test case
      const ELEMENT_WITHOUT_CLASS = document.createElement('div');
      toggleClass(ELEMENT_WITHOUT_CLASS, CLASS_TO_TOGGLE);
      // expected
      const ELEMENT_WITHOUT_CLASS_EXPECTED = document.createElement('div');
      ELEMENT_WITHOUT_CLASS_EXPECTED.classList.add(CLASS_TO_TOGGLE);
      expect(ELEMENT_WITHOUT_CLASS).toEqual(ELEMENT_WITHOUT_CLASS_EXPECTED);
    });
    it('adds specified class to an element that already has another class', () => {
      // test case
      const ELEMENT_WITH_SINGLE_CLASS = document.createElement('div');
      ELEMENT_WITH_SINGLE_CLASS.classList.add(CLASS_SECONDARY);
      toggleClass(ELEMENT_WITH_SINGLE_CLASS, CLASS_TO_TOGGLE);
      // expected
      const ELEMENT_WITH_SINGLE_CLASS_EXPECTED = document.createElement('div');
      ELEMENT_WITH_SINGLE_CLASS_EXPECTED.classList.add(CLASS_SECONDARY, CLASS_TO_TOGGLE);
      expect(ELEMENT_WITH_SINGLE_CLASS).toEqual(ELEMENT_WITH_SINGLE_CLASS_EXPECTED);
    });
    it('adds specified class to an element that already has more than one other classes', () => {
      // test case
      const ELEMENT_WITH_MULTIPLE_CLASSES = document.createElement('div');
      ELEMENT_WITH_MULTIPLE_CLASSES.classList.add(CLASS_TO_TOGGLE, CLASS_SECONDARY);
      toggleClass(ELEMENT_WITH_MULTIPLE_CLASSES, CLASS_TO_TOGGLE);
      // expected
      const ELEMENT_WITH_MULTIPLE_CLASSES_EXPECTED = document.createElement('div');
      ELEMENT_WITH_MULTIPLE_CLASSES_EXPECTED.classList.add(CLASS_SECONDARY);
      expect(ELEMENT_WITH_MULTIPLE_CLASSES).toEqual(ELEMENT_WITH_MULTIPLE_CLASSES_EXPECTED);
    });
  });
  describe('removing a class', () => {
    it('removes specified class from an element that only has the specified class', () => {
      // test case
      const ELEMENT_WITH_ONLY_SPECIFIED_CLASS = document.createElement('div');
      ELEMENT_WITH_ONLY_SPECIFIED_CLASS.classList.add(CLASS_TO_TOGGLE);
      toggleClass(ELEMENT_WITH_ONLY_SPECIFIED_CLASS, CLASS_TO_TOGGLE);
      // expected
      const ELEMENT_WITH_ONLY_SPECIFIED_CLASS_EXPECTED = document.createElement('div');
      ELEMENT_WITH_ONLY_SPECIFIED_CLASS_EXPECTED.className = '';
      expect(ELEMENT_WITH_ONLY_SPECIFIED_CLASS).toEqual(ELEMENT_WITH_ONLY_SPECIFIED_CLASS_EXPECTED);
    });
    it('removes specified class from an element that has specified class, and others', () => {
      // test case
      const ELEMENT_WITH_SPECIFIED_CLASS_AND_OTHERS = document.createElement('div');
      ELEMENT_WITH_SPECIFIED_CLASS_AND_OTHERS.classList.add(
        CLASS_TO_TOGGLE,
        CLASS_SECONDARY,
        CLASS_TERTIARY
      );
      toggleClass(ELEMENT_WITH_SPECIFIED_CLASS_AND_OTHERS, CLASS_TO_TOGGLE);
      // expected
      const ELEMENT_WITH_SPECIFIED_CLASS_AND_OTHERS_EXPECTED = document.createElement('div');
      ELEMENT_WITH_SPECIFIED_CLASS_AND_OTHERS_EXPECTED.classList.add(
        CLASS_SECONDARY,
        CLASS_TERTIARY
      );
      expect(ELEMENT_WITH_SPECIFIED_CLASS_AND_OTHERS).toEqual(
        ELEMENT_WITH_SPECIFIED_CLASS_AND_OTHERS_EXPECTED
      );
    });
  });
});
