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
        'text!./res/indicator-template.html'
    ], function (indicatorTemplate) {

        function Indicator(openmct) {
            this.openmct = openmct;
            this.textValue = '';
            this.descriptionValue = '';
            this.cssClassValue = '';
            this.iconClassValue = '';
            this.textClassValue = '';
        }

        Indicator.prototype.text = function (text) {
            if (text !== undefined && text !== this.textValue) {
                this.textValue = text;
                if (this.renderView) {
                    render.call(this);
                }
            }

            return this.textValue;
        }

        Indicator.prototype.description = function (description) {
            if (description !== undefined && description !== this.descriptionValue) {
                this.descriptionValue = description;
                renderIndicator.call(this);
            }

            return this.descriptionValue;
        }

        Indicator.prototype.iconClass = function (iconClass) {
            if (iconClass !== undefined && iconClass !== this.iconClass) {
                this.iconClassValue = iconClass;
                renderIndicator.call(this);
            }

            return this.iconClassValue;
        }

        Indicator.prototype.cssClass = function (cssClass) {
            if (cssClass !== undefined && cssClass !== this.cssClass) {
                this.cssClassValue = cssClass;
                renderIndicator.call(this);
            }

            return this.cssClassValue;
        }

        Indicator.prototype.textClass = function (textClass) {
            if (textClass !== undefined && textClass !== this.textClass) {
                this.textClassValue = textClass;
                renderIndicator.call(this);
            }

            return this.textClassValue;
        }

        function renderIndicator() {
            this.element.innerHTML = 
            indicatorTemplate.replace('{{indicator.text}}', indicator.text())
                .replace('{{indicator.textClass}}', indicator.textClass())
                .replace('{{indicator.cssClass}}', indicator.cssClass())
                .replace('{{indicator.description}}', indicator.description());
        }

        Indicator.defaultDisplayFunction = function () {
            this.usingDefaultDisplay = true;

            if (!this.element) {
                this.element = document.createElement('div');
            }

            renderIndicator.call(this);

            return this.element;
        }

        return Indicator;
});