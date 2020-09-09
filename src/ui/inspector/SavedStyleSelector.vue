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
        @click="applySavedStyle(savedStyle)"
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
                        background: savedStyle.border
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
        <toolbar-button
            v-if="!isDefaultStyle"
            class="c-style__toolbar-button--delete"
            :options="deleteOptions"
            @click.stop="deleteStyle()"
        />
    </span>
</div>
</template>

<script>
import { STYLE_CONSTANTS } from "@/plugins/condition/utils/constants";
import {getStylesWithoutNoneValue} from "@/plugins/condition/utils/styleUtils";
import ToolbarButton from "@/ui/toolbar/components/toolbar-button.vue";

export default {
    name: 'SavedStyleSelector',
    components: {
        ToolbarButton
    },
    inject: [
        'openmct',
        'stylesManager'
    ],
    props: {
        isEditing: {
            type: Boolean
        },
        savedStyle: {
            type: Object,
            required: true
        }
    },
    computed: {
        hash() {
            return `
                backgroundColor:${this.savedStyle.backgroundColor}
                border:${this.savedStyle.border}
                color:${this.savedStyle.color}
            `;
        },
        isDefaultStyle() {
            const defaultHash = `
                backgroundColor:
                border:
                color:
            `;

            return this.hash === defaultHash;
        },
        itemStyle() {
            return getStylesWithoutNoneValue(this.savedStyle);
        },
        borderColorOption() {
            let value = this.savedStyle.border.replace('1px solid ', '');

            return {
                icon: 'icon-line-horz',
                title: STYLE_CONSTANTS.borderColorTitle,
                value: this.normalizeValueForSwatch(value),
                property: 'border',
                isEditing: this.isEditing,
                nonSpecific: this.mixedStyles.indexOf('border') > -1
            };
        },
        backgroundColorOption() {
            let value = this.savedStyle.backgroundColor;

            return {
                icon: 'icon-paint-bucket',
                title: STYLE_CONSTANTS.backgroundColorTitle,
                value: this.normalizeValueForSwatch(value),
                property: 'backgroundColor',
                isEditing: this.isEditing,
                nonSpecific: this.mixedStyles.indexOf('backgroundColor') > -1
            };
        },
        colorOption() {
            let value = this.savedStyle.color;

            return {
                icon: 'icon-font',
                title: STYLE_CONSTANTS.textColorTitle,
                value: this.normalizeValueForSwatch(value),
                property: 'color',
                isEditing: this.isEditing,
                nonSpecific: this.mixedStyles.indexOf('color') > -1
            };
        },
        imageUrlOption() {
            return {
                icon: 'icon-image',
                title: STYLE_CONSTANTS.imagePropertiesTitle,
                dialog: {
                    name: "Image Properties",
                    sections: [
                        {
                            rows: [
                                {
                                    key: "url",
                                    control: "textfield",
                                    name: "Image URL",
                                    "cssClass": "l-input-lg"
                                }
                            ]
                        }
                    ]
                },
                property: 'imageUrl',
                formKeys: ['url'],
                value: {url: this.savedStyle.imageUrl},
                isEditing: this.isEditing,
                nonSpecific: this.mixedStyles.indexOf('imageUrl') > -1
            };
        },
        isStyleInvisibleOption() {
            return {
                value: this.savedStyle.isStyleInvisible,
                property: 'isStyleInvisible',
                isEditing: this.isEditing,
                options: [
                    {
                        value: '',
                        icon: 'icon-eye-disabled',
                        title: STYLE_CONSTANTS.visibilityHidden
                    },
                    {
                        value: STYLE_CONSTANTS.isStyleInvisible,
                        icon: 'icon-eye-open',
                        title: STYLE_CONSTANTS.visibilityVisible
                    }
                ]
            };
        },
        deleteOptions() {
            return {
                icon: 'icon-trash',
                title: 'Delete style',
                // value: this.normalizeValueForSwatch(value),
                // property: 'color',
                isEditing: this.isEditing
                // nonSpecific: this.mixedStyles.indexOf('color') > -1
            };
        }
    },
    methods: {
        applySavedStyle() {
            this.stylesManager.select(this.savedStyle);
        },
        deleteStyle() {
            this.stylesManager.delete(this.savedStyle);
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
