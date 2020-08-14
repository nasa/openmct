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
<div
    v-if="isEditing"
    class="c-inspect-properties"
>
    <div class="c-inspect-properties__header">
        Layout Dimensions
    </div>
    <ul class="c-inspect-properties__section">
        <li class="c-inspect-properties__row">
            <div
                class="c-inspect-properties__label"
                title="Layout Width"
            >
                <label for="layout-width">Width</label>
            </div>
            <div class="c-inspect-properties__value">
                <input
                    id="layout-width"
                    v-model="layoutWidth"
                    type="number"
                    placeholder="Width"
                    @input="setLayoutDimensions"
                >
            </div>
        </li>
        <li class="c-inspect-properties__row">
            <div
                class="c-inspect-properties__label"
                title="Layout Height"
            >
                <label for="layout-height">Height</label>
            </div>
            <div class="c-inspect-properties__value">
                <input
                    id="layout-height"
                    v-model="layoutHeight"
                    type="number"
                    placeholder="Height"
                    @input="setLayoutDimensions"
                >
            </div>
        </li>
    </ul>
</div>
</template>

<script>
export default {
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            isEditing: this.openmct.editor.isEditing(),
            layoutWidth: undefined,
            layoutHeight: undefined
        };
    },
    mounted() {
        this.openmct.editor.on('isEditing', this.toggleEdit);

        if (this.domainObject.configuration) {
            if (this.domainObject.configuration.layoutDimensions) {
                this.layoutWidth = this.domainObject.configuration.layoutDimensions[0];
                this.layoutHeight = this.domainObject.configuration.layoutDimensions[1];
            }
        }
    },
    destroyed() {
        this.openmct.editor.off('isEditing', this.toggleEdit);
    },
    methods: {
        toggleEdit(isEditing) {
            this.isEditing = isEditing;
        },
        setLayoutDimensions() {
            this.openmct.objects.mutate(
                this.domainObject,
                'configuration.layoutDimensions',
                [this.layoutWidth, this.layoutHeight]
            );
        }
    }
};

</script>
