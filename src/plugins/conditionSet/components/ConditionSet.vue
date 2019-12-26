/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2019, United States Government
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
<div class="c-object-view u-contents">
    <div class="c-sw-edit w-summary-widget">
        <div class="c-sw-edit__ui holder">
            <section class="current-output">
                <div class="c-sw-edit__ui__header">
                    <span class="c-disclosure-triangle is-enabled t-view-control-test-data"></span>
                    <span class="c-sw-edit__ui__header-label">Current Output</span>
                </div>
                <div class="t-test-data-config">
                    <div id="ruleArea"
                         class="c-sw-editui__rules widget-rules"
                    >
                        <span>DATA_PRESENT</span>
                    </div>
                </div>
            </section>
            <section v-show="isEditing"
                     class="test-data"
            >
                <div class="c-sw-edit__ui__header">
                    <span class="c-disclosure-triangle is-enabled t-view-control-test-data c-disclosure-triangle--expanded"></span>
                    <span class="c-sw-edit__ui__header-label">Test Data</span>
                </div>
                <div class="c-sw-edit__ui holder l-flex-accordion flex-elem grows widget-edit-holder expanded-widget-rules expanded-widget-test-data">
                    <div class="flex-accordion-holder t-widget-test-data-content w-widget-test-data-content">
                        <div class="l-enable">
                            <label class="checkbox custom">
                                Apply Test Values
                                <input type="checkbox"
                                       class="t-test-data-checkbox"
                                >
                            </label>
                        </div>
                        <div class="t-test-data-config">
                            <div class="c-sw-editui__rules widget-rules">
                                <span>[data]</span>
                            </div>
                            <div class="holder add-rule-button-wrapper align-right">
                                <button
                                    v-show="isEditing"
                                    id="addRule"
                                    class="c-button c-button--major add-test-condition icon-plus"
                                >
                                    <span class="c-button__label">Add Test Value</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Conditions :is-editing="isEditing" />
        </div>
    </div>
</div>
</template>

<script>
import Conditions from './Conditions.vue';

export default {
    inject: ["openmct", "objectPath", "domainObject"],
    components: {
        Conditions
    },
    props: {
        isEditing: Boolean
    }
};
</script>

