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
    ['./ElementProxy', './AccessorMutator'],
    function (ElementProxy, AccessorMutator) {
        'use strict';

        /**
         * Selection proxy for Box elements in a fixed position view.
         * Also serves as a superclass for Text elements, since those
         * elements have a superset of Box properties.
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
         */
        function BoxProxy(element, index, elements) {
            var proxy = new ElementProxy(element, index, elements);

            /**
             * Get/set this element's fill color. (Omitting the
             * argument makes this act as a getter.)
             * @method
             * @param {string} fill the new fill color
             * @returns {string} the fill color
             * @memberof platform/features/layout.BoxProxy#
             */
            proxy.fill = new AccessorMutator(element, 'fill');

            return proxy;
        }

        return BoxProxy;
    }
);
