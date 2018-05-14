/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

define([], function () {
    /**
     * Allows support for common user actions to be attached to views.
     * @interface GestureAPI
     * @memberof module:openmct
     */
    function GestureAPI(selectGesture, contextMenuGesture) {
        this.selectGesture = selectGesture;
        this.contextMenuGesture = contextMenuGesture;
    }

    /**
     * Designate an HTML element as selectable, and associated with a
     * particular object.
     *
     * @param {HTMLElement} htmlElement the element to make selectable
     * @param {*} item the object which should become selected when this
     *        element is clicked.
     * @returns {Function} a function to remove selectability from this
     *          HTML element.
     * @method selectable
     * @memberof module:openmct.GestureAPI#
     */
    GestureAPI.prototype.selectable = function (htmlElement, item) {
        return this.selectGesture.apply(htmlElement, item);
    };


    /**
     * Designate an HTML element as having a context menu associated with
     * the provided item.
     *
     * @private
     * @param {HTMLElement} htmlElement the element to make selectable
     * @param {*} item the object for which a context menu should appear
     * @returns {Function} a function to remove this geture from this
     *          HTML element.
     * @method selectable
     * @memberof module:openmct.GestureAPI#
     */
    GestureAPI.prototype.contextMenu = function (htmlElement, item) {
        return this.contextMenuGesture.apply(htmlElement, item);
    };

    return GestureAPI;
});
