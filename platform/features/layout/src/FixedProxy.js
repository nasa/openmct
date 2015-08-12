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
/*global define,window*/

define(
    ['./elements/ElementFactory'],
    function (ElementFactory) {
        "use strict";

        /**
         * Proxy for configuring a fixed position view via the toolbar.
         * @memberof platform/features/layout
         * @constructor
         * @param {Function} addElementCallback callback to invoke when
         *        elements are created
         * @param $q Angular's $q, for promise-handling
         * @param {DialogService} dialogService dialog service to use
         *        when adding a new element will require user input
         */
        function FixedProxy(addElementCallback, $q, dialogService) {
            this.factory = new ElementFactory(dialogService);
            this.$q = $q;
            this.addElementCallback = addElementCallback;
        }

        /**
         * Add a new visual element to this view. Supported types are:
         *
         * * `fixed.image`
         * * `fixed.box`
         * * `fixed.text`
         * * `fixed.line`
         *
         * @param {string} type the type of element to add
         */
        FixedProxy.prototype.add = function (type) {
            var addElementCallback = this.addElementCallback;

            // Place a configured element into the view configuration
            function addElement(element) {
                // Configure common properties of the element
                element.x = element.x || 0;
                element.y = element.y || 0;
                element.width = element.width || 1;
                element.height = element.height || 1;
                element.type = type;

                // Finally, add it to the view's configuration
                addElementCallback(element);
            }

            // Defer creation to the factory
            this.$q.when(this.factory.createElement(type)).then(addElement);
        };

        return FixedProxy;
    }
);
