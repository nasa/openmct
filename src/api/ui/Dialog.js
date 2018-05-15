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

define(['text!./dialog.html', 'zepto'], function (dialogTemplate, $) {

    /**
     * A dialog may be displayed to show blocking content to users.
     * @param {module:openmct.View} view the view to show in the dialog
     * @param {string} [title] the title for this dialog
     * @constructor
     * @memberof module:openmct
     */
    function Dialog(view, title) {
        this.view = view;
        this.title = title;
        this.showing = false;
        this.enabledState = true;
    }

    /**
     * Display this dialog.
     * @returns {Promise} a promise that will be resolved if the user
     *          chooses "OK", an rejected if the user chooses "cancel"
     * @method show
     * @memberof module:openmct.Dialog#
     */
    Dialog.prototype.show = function () {
        if (this.showing) {
            throw new Error("Dialog already showing.");
        }

        var $body = $('body');
        var $dialog = $(dialogTemplate);
        var $contents = $dialog.find('.contents .editor');
        var $close = $dialog.find('.close');

        var $ok = $dialog.find('.ok');
        var $cancel = $dialog.find('.cancel');

        if (this.title) {
            $dialog.find('.title').text(this.title);
        }

        $body.append($dialog);
        this.view.show($contents[0]);
        this.$dialog = $dialog;
        this.$ok = $ok;
        this.showing = true;

        [$ok, $cancel, $close].forEach(function ($button) {
            $button.on('click', this.hide.bind(this));
        }.bind(this));

        return new Promise(function (resolve, reject) {
            $ok.on('click', resolve);
            $cancel.on('click', reject);
            $close.on('click', reject);
        });
    };

    Dialog.prototype.hide = function () {
        if (!this.showing) {
            return;
        }
        this.$dialog.remove();
        this.view.destroy();
        this.showing = false;
    };

    /**
     * Get or set the "enabled" state of the OK button for this dialog.
     * @param {boolean} [state] true to enable, false to disable
     * @returns {boolean} true if enabled, false if disabled
     * @method enabled
     * @memberof module:openmct.Dialog#
     */
    Dialog.prototype.enabled = function (state) {
        if (state !== undefined) {
            this.enabledState = state;
            if (this.showing) {
                this.$ok.toggleClass('disabled', !state);
            }
        }
        return this.enabledState;
    };

    return Dialog;
});
