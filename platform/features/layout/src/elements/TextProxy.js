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
/*global define*/

define(
    ['./BoxProxy', './AccessorMutator'],
    function (BoxProxy, AccessorMutator) {
        'use strict';

        /**
         * Selection proxy for Text elements in a fixed position view.
         *
         * Note that arguments here are meant to match those expected
         * by `Array.prototype.map`
         *
         * @memberof platform/features/layout
         * @constructor
         * @param element the fixed position element, as stored in its
         *        configuration
         * @param index the element's index within its array
         * @param {Array} elements the full array of elements
         * @augments {platform/features/layout.ElementProxy}
         */
        function TextProxy(element, index, elements) {
            var proxy = new BoxProxy(element, index, elements);

            /**
             * Get and/or set the text color of this element.
             * @param {string} [color] the new text color (if setting)
             * @returns {string} the text color
             * @memberof platform/features/layout.TextProxy#
             */
            proxy.color = new AccessorMutator(element, 'color');

            /**
             * Get and/or set the displayed text of this element.
             * @param {string} [text] the new text (if setting)
             * @returns {string} the text
             * @memberof platform/features/layout.TextProxy#
             */
            proxy.text = new AccessorMutator(element, 'text');

            return proxy;
        }

        return TextProxy;
    }
);
