/*****************************************************************************
* Open MCT, Copyright (c) 2014-2020, United States Government
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

<template>
<div class="c-style">
    <span
        class="c-style-thumb"
        :style="[savedStyle.imageUrl ? { backgroundImage:'url(' + savedStyle.imageUrl + ')'} : savedStyle ]"
    >
        <span
            class="c-style-thumb__text"
            :class="{ 'hide-nice': !hasProperty(savedStyle.color) }"
        >
            ABC
        </span>
    </span>
    <span class="c-toolbar">
        <div class="c-ctrl-wrapper">
            <div
                class="c-icon-button--disabled c-icon-button--swatched icon-line-horz"
                title="Border color"
            >
                <div
                    class="c-swatch"
                    :style="{
                        background: borderColor
                    }"
                ></div>
            </div>
        </div>
        <div class="c-ctrl-wrapper">
            <div
                class="c-icon-button--disabled c-icon-button--swatched icon-paint-bucket"
                title="Background color"
            >
                <div
                    class="c-swatch"
                    :style="{
                        background: savedStyle.backgroundColor
                    }"
                ></div>
            </div>
        </div>
        <div class="c-ctrl-wrapper">
            <div
                class="c-icon-button--disabled c-icon-button--swatched icon-font"
                title="Text color"
            >
                <div
                    class="c-swatch"
                    :style="{
                        background: savedStyle.color
                    }"
                ></div>
            </div>
        </div>

        <!-- delete saved style -->
        <div
            v-if="!isDefaultStyle"
            class="c-ctrl-wrapper"
        >
            <div
                class="c-icon-button icon-trash"
                title="Delete Style"
                @click.stop="deleteStyle()"
            >
            </div>
        </div>
    </span>
</div>
</template>

<script>
import {getStylesWithoutNoneValue} from "@/plugins/condition/utils/styleUtils";

export default {
    name: 'SavedStyleSelector',
    inject: [
        'openmct',
        'stylesManager'
    ],
    props: {
        savedStyle: {
            type: Object,
            required: true
        }
    },
    computed: {
        borderColor() {
            return this.savedStyle.border.substring(this.savedStyle.border.indexOf('#'));
        },
        isDefaultStyle() {
            return this.stylesManager.isDefaultStyle(this.savedStyle);
        },
        itemStyle() {
            return getStylesWithoutNoneValue(this.savedStyle);
        }
    },
    methods: {
        applySavedStyle() {
            this.stylesManager.select(this.savedStyle);
        },
        deleteStyle(style) {
            this.showConfirmDialog(style)
                .then(() => {
                    this.stylesManager.delete(this.savedStyle);
                })
                .catch(() => {});
        },
        showConfirmDialog(style) {
            const message = `
                This will delete this saved style.
                This action will not effect styling that has already been applied.
                Do you want to continue?
            `;

            return new Promise((resolve, reject) => {
                let dialog = this.openmct.overlays.dialog({
                    title: 'Delete Saved Style',
                    iconClass: 'alert',
                    message: message,
                    buttons: [
                        {
                            label: 'OK',
                            callback: () => {
                                dialog.dismiss();
                                resolve();
                            }
                        },
                        {
                            label: 'Cancel',
                            callback: () => {
                                dialog.dismiss();
                                reject();
                            }
                        }
                    ]
                });
            });
        },
        hasProperty(property) {
            return property !== undefined;
        },
        normalizeValueForSwatch(value) {
            if (value && value.indexOf('__no_value') > -1) {
                return value.replace('__no_value', 'transparent');
            }

            return value;
        },
        normalizeValueForStyle(value) {
            if (value && value === 'transparent') {
                return '__no_value';
            }

            return value;
        },
        updateStyleValue(value, item) {
            value = this.normalizeValueForStyle(value);
            if (item.property === 'border') {
                value = '1px solid ' + value;
            }

            if (value && (value.url !== undefined)) {
                this.savedStyle[item.property] = value.url;
            } else {
                this.savedStyle[item.property] = value;
            }

            this.$emit('persist', this.styleItem, item.property);
        }
    }
};
</script>
