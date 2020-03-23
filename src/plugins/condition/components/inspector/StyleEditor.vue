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
    <span class="c-style-thumb"
          :style="[styleItem.style.imageUrl ? { backgroundImage:'url(' + styleItem.style.imageUrl + ')'} : styleItem.style ]"
    >
        <span class="c-style-thumb__text"
              :class="{ 'hide-nice': !styleItem.style.color }"
        >
            ABC
        </span>
    </span>
    <span v-if="isEditing"
          class="c-toolbar"
    >
        <toolbar-color-picker v-if="styleItem.style.border"
                              class="u-menu-to--center"
                              :options="borderColorOption"
                              @change="updateStyleValue"
        />
        <toolbar-color-picker v-if="styleItem.style.backgroundColor"
                              class="u-menu-to--center"
                              :options="backgroundColorOption"
                              @change="updateStyleValue"
        />
        <toolbar-color-picker v-if="styleItem.style.color"
                              class="u-menu-to--center"
                              :options="colorOption"
                              @change="updateStyleValue"
        />
        <toolbar-button v-if="styleItem.style.imageUrl !== undefined"
                        :options="imageUrlOption"
                        @change="updateStyleValue"
        />
        <toolbar-toggle-button v-if="styleItem.style.isStyleInvisible !== undefined"
                               :options="isStyleInvisibleOption"
                               @change="updateStyleValue"
        />
    </span>
</div>
</template>

<script>

import ToolbarColorPicker from "@/ui/toolbar/components/toolbar-color-picker.vue";
import ToolbarButton from "@/ui/toolbar/components/toolbar-button.vue";
import ToolbarToggleButton from "@/ui/toolbar/components/toolbar-toggle-button.vue";

export default {
    name: 'StyleEditor',
    components: {
        ToolbarButton,
        ToolbarColorPicker,
        ToolbarToggleButton
    },
    inject: [
        'openmct'
    ],
    props: {
        isEditing: {
            type: Boolean
        },
        styleItem: {
            type: Object,
            required: true
        }
    },
    computed: {
        borderColorOption() {
            return {
                icon: 'icon-line-horz',
                title: 'Set border color',
                value: this.styleItem.style.border.replace('1px solid ', ''),
                property: 'border',
                isEditing: this.isEditing
            }
        },
        backgroundColorOption() {
            return {
                icon: 'icon-paint-bucket',
                title: 'Set background color',
                value: this.styleItem.style.backgroundColor,
                property: 'backgroundColor',
                isEditing: this.isEditing
            }
        },
        colorOption() {
            return {
                icon: 'icon-font',
                title: 'Set text color',
                value: this.styleItem.style.color,
                property: 'color',
                isEditing: this.isEditing
            }
        },
        imageUrlOption() {
            return {
                icon: 'icon-image',
                title: 'Edit image properties',
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
                value: {url: this.styleItem.style.imageUrl},
                isEditing: this.isEditing
            }
        },
        isStyleInvisibleOption() {
            return {
                value: this.styleItem.style.isStyleInvisible,
                property: 'isStyleInvisible',
                isEditing: this.isEditing,
                options: [
                    {
                        value: '',
                        icon: 'icon-frame-hide',
                        title: "Hidden"
                    },
                    {
                        value: 'is-style-invisible',
                        icon: 'icon-frame-show',
                        title: "Visible"
                    }
                ]
            }

        }
    },
    methods: {
        updateStyleValue(value, item) {
            if (item.property === 'border') {
                value = '1px solid ' + value;
            }
            if (value && (value.url !== undefined)) {
                this.styleItem.style[item.property] = value.url;
            } else {
                this.styleItem.style[item.property] = value;
            }
            this.$emit('persist', this.styleItem);
        }
    }
}
</script>
