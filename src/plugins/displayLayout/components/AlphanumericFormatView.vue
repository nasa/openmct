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

<template>
    <div class="c-properties" v-if="isEditing">
        <div class="c-properties__header">Alphanumeric Format</div>
        <ul class="c-properties__section" v-if="!multiSelect">
            <li class="c-properties__row">
                <div class="c-properties__label" title="Printf formatting for the selected telemetry">
                    <label for="telemetryPrintfFormat">Format</label>
                </div>
                <div class="c-properties__value">
                    <input id="telemetryPrintfFormat" type="text" @change="formatTelemetry" :value="telemetryFormat">
                </div>
            </li>
        </ul>
        <div class="c-properties__row--span-all" v-if="multiSelect">No format to display for multiple items</div>
    </div>
</template>

<script>
    export default {
        inject: ['openmct'],
        data() {
            let selectionPath = this.openmct.selection.get()[0];
            return {
                isEditing: this.openmct.editor.isEditing(),
                telemetryFormat: selectionPath[0].context.layoutItem.format,
                multiSelect: false
            }
        },
        methods: {
            toggleEdit(isEditing) {
                this.isEditing = isEditing;
            },
            formatTelemetry(event) {
                let selectionPath = this.openmct.selection.get()[0];
                let newFormat = event.currentTarget.value;
                selectionPath[0].context.updateTelemetryFormat(newFormat);
                this.telemetryFormat = newFormat;
            },
            handleSelection(selection) {
                if (selection.length === 0 || selection[0].length === 0) {
                    return;
                }

                this.multiSelect = selection.length > 1 ? true : false;
            }
        },
        mounted() {
            this.openmct.editor.on('isEditing', this.toggleEdit);
            this.openmct.selection.on('change', this.handleSelection);
            this.handleSelection(this.openmct.selection.get());
        },
        destroyed() {
            this.openmct.editor.off('isEditing', this.toggleEdit);
            this.openmct.selection.off('change', this.handleSelection);
        }
    }

</script>