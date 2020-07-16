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
<div
    class="c-so-view has-local-controls"
    :class="{
        'c-so-view--no-frame': !hasFrame,
        'has-complex-content': complexContent
    }"
>
    <div class="c-so-view__header">
        <div class="c-object-label">
            <div class="c-object-label__type-icon"
                 :class="[cssClass, classList]"
            ></div>
            <div class="c-object-label__name">
                {{ domainObject && domainObject.name }}
            </div>
        </div>
        <context-menu-drop-down
            :object-path="objectPath"
        />
    </div>
    <div class="c-so-view__local-controls c-so-view__view-large h-local-controls c-local-controls--show-on-hover">
        <button
            class="c-button icon-expand"
            title="View Large"
            @click="expand"
        ></button>
    </div>
    <object-view
        ref="objectView"
        class="c-so-view__object-view"
        :object="domainObject"
        :show-edit-view="showEditView"
        :object-path="objectPath"
    />
</div>
</template>

<script>
import ObjectView from './ObjectView.vue'
import ContextMenuDropDown from './contextMenuDropDown.vue';
import PreviewHeader from '@/ui/preview/preview-header.vue';
import Vue from 'vue';

const SIMPLE_CONTENT_TYPES = [
    'clock',
    'timer',
    'summary-widget',
    'hyperlink',
    'conditionWidget'
];

export default {
    inject: ['openmct'],
    components: {
        ObjectView,
        ContextMenuDropDown
    },
    props: {
        domainObject: {
            type: Object,
            required: true
        },
        objectPath: {
            type: Array,
            required: true
        },
        hasFrame: Boolean,
        showEditView: {
            type: Boolean,
            default: true
        }
    },
    data() {
        let objectType = this.openmct.types.get(this.domainObject.type),
            cssClass = objectType && objectType.definition ? objectType.definition.cssClass : 'icon-object-unknown',
            complexContent = !SIMPLE_CONTENT_TYPES.includes(this.domainObject.type);

        return {
            cssClass,
            complexContent
        }
    },
    computed: {
        classList() {
            const classList = this.domainObject.classList;
            if (!classList || !classList.length) {
                return '';
            }

            return classList.join(' ');
        }
    },
    methods: {
        expand() {
            let objectView = this.$refs.objectView,
                parentElement = objectView.$el,
                childElement = parentElement.children[0];

            this.openmct.overlays.overlay({
                element: this.getOverlayElement(childElement),
                size: 'large',
                onDestroy() {
                    parentElement.append(childElement);
                }
            });
        },
        getOverlayElement(childElement) {
            const fragment = new DocumentFragment();
            const header = this.getPreviewHeader();
            fragment.append(header);
            fragment.append(childElement);

            return fragment;
        },
        getPreviewHeader() {
            const domainObject = this.objectPath[0];
            const preview = new Vue({
                components: {
                    PreviewHeader
                },
                provide: {
                    openmct: this.openmct,
                    objectPath: this.objectPath
                },
                data() {
                    return {
                        domainObject
                    }
                },
                template: '<PreviewHeader :domainObject="domainObject" :hideViewSwitcher="true" :showNotebookMenuSwitcher="true"></PreviewHeader>'
            });

            return preview.$mount().$el;
        },
        getSelectionContext() {
            return this.$refs.objectView.getSelectionContext();
        }
    }
}
</script>
