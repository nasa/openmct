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
    'zepto',
    'text!../../res/templates/tree/toggle.html'
], ($, toggleTemplate) => {
    class ToggleView {
      constructor(state) {
        this.expanded = !!state;
        this.callbacks = [];
        this.el = $(toggleTemplate);
        this.el.on('click', () => {
            this.value(!this.expanded);
        });
    }

    value(state) {
        this.expanded = state;

        if (state) {
            this.el.addClass('expanded');
        } else {
            this.el.removeClass('expanded');
        }

        this.callbacks.forEach( (callback) => {
            callback(state);
        });
    };

    observe(callback) {
        this.callbacks.push(callback);
        return () => {
            this.callbacks = this.callbacks.filter( (c) => {
                return c !== callback;
            });
        }
    };

    elements() {
        return this.el;
    };
  }
    return ToggleView;
});
