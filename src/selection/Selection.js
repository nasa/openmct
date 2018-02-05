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

define(['EventEmitter'], function (EventEmitter) {

    /**
     * Manages selection state for Open MCT
     * @private
     */
    function Selection() {
        EventEmitter.call(this);
        this.selected = [];
    }

    Selection.prototype = Object.create(EventEmitter.prototype);

    /**
     * Gets the selected object.
     * @public
     */
    Selection.prototype.get = function () {
        return this.selected;
    };

    /**
     * Selects the selectable object and emits the 'change' event.
     *
     * @param {object} selectable an object with element and context properties
     * @private
     */
    Selection.prototype.select = function (selectable) {
        if (!Array.isArray(selectable)) {
            selectable = [selectable];
        }

        if (this.selected[0] && this.selected[0].element) {
            this.selected[0].element.classList.remove('s-selected');
        }

        if (this.selected[1]) {
            this.selected[1].element.classList.remove('s-selected-parent');
        }

        if (selectable[0] && selectable[0].element) {
            selectable[0].element.classList.add('s-selected');
        }

        if (selectable[1]) {
            selectable[1].element.classList.add('s-selected-parent');
        }

        this.selected = selectable;
        this.emit('change', this.selected);
    };

    /**
     * @private
     */
    Selection.prototype.capture = function (selectable) {
        if (!this.capturing) {
            this.capturing = [];
        }

        this.capturing.push(selectable);
    };

    /**
     * @private
     */
    Selection.prototype.selectCapture = function (selectable) {
        if (!this.capturing) {
            return;
        }

        this.select(this.capturing.reverse());
        delete this.capturing;
    };

    /**
     * Attaches the click handlers to the element.
     *
     * @param element an html element
     * @param context object with oldItem, item and toolbar properties
     * @param select a flag to select the element if true
     * @returns a function that removes the click handlers from the element
     * @public
     */
    Selection.prototype.selectable = function (element, context, select) {
        var selectable = {
            context: context,
            element: element
        };
        var capture = this.capture.bind(this, selectable);
        var selectCapture = this.selectCapture.bind(this, selectable);
        element.addEventListener('click', capture, true);
        element.addEventListener('click', selectCapture);

        if (select) {
            element.click();
        }

        return function () {
            element.removeEventListener('click', capture);
            element.removeEventListener('click', selectCapture);
        };
    };

    return Selection;
});
