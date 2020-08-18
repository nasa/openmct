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
        'has-complex-content': complexContent,
        'is-missing': domainObject.status === 'missing'
    }"
>
    <div class="c-so-view__header">
        <div class="c-object-label"
             :class="{
                 classList,
                 'is-missing': domainObject.status === 'missing'
             }"
        >
            <div class="c-object-label__type-icon"
                 :class="cssClass"
            >
                <span class="is-missing__indicator"
                      title="This item is missing"
                ></span>
            </div>
            <div class="c-object-label__name">
                {{ domainObject && domainObject.name }}
            </div>
        </div>
    </div>
    <div class="c-so-view__local-controls c-so-view__view-large h-local-controls c-local-controls--show-on-hover">
        <button 
            v-for="(item, index) in statusBarItems"
            style="margin: 2px;"
            class="c-button"
            :title="item.name"
            :key="index"
            :class="item.cssClass"
            @click="item.callBack"
        >
        </button>

        <button
            class="c-button icon-expand"
            title="View Large"
            @click="expand"
        ></button>
        <button
            class="c-button icon-dataset"
            title="View menu items"
            @click.prevent.stop="showMenuItems($event)"
        ></button>
    </div>
    <div class="is-missing__indicator"
         title="This item is missing"
    ></div>
    <object-view
        ref="objectView"
        class="c-so-view__object-view"
        :object="domainObject"
        :show-edit-view="showEditView"
        :object-path="objectPath"
        @change-provider="setViewProvider"
    />
</div>
</template>

<script>
import ObjectView from './ObjectView.vue';
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
            complexContent = !SIMPLE_CONTENT_TYPES.includes(this.domainObject.type),
            viewProvider = {},
            statusBarItems = {};

        return {
            cssClass,
            complexContent,
            viewProvider,
            statusBarItems
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
            let objectView = this.$refs.objectView;
            let parentElement = objectView.$el;
            let childElement = parentElement.children[0];

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
            const wrapper = document.createElement('div');
            wrapper.classList.add('l-preview-window__object-view');
            wrapper.append(childElement);
            fragment.append(header);
            fragment.append(wrapper);

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
                    };
                },
                template: '<PreviewHeader :domainObject="domainObject" :hideViewSwitcher="true" :showNotebookMenuSwitcher="true"></PreviewHeader>'
            });

            return preview.$mount().$el;
        },
        getSelectionContext() {
            return this.$refs.objectView.getSelectionContext();
        },
        setViewProvider(provider) {
            this.viewProvider = provider;
            this.initializeStatusBarItems();
        },
        initializeStatusBarItems() {
            if (!this.actionsListener) {
                this.openmct.actions.on('update', this.setStatusBarItems)
                this.actionsListener = true;
            }

            let viewContext = this.viewProvider.getViewContext && this.viewProvider.getViewContext();

            if (viewContext) {
                this.viewKey = viewContext.getViewKey();
                this.statusBarItems = this.openmct.actions._applicableViewActions(this.viewKey).filter(action => action.showInStatusBar);
            } else {
                this.openmct.actions.off('update', this.setStatusBarItems);
            }
        },
        setStatusBarItems(viewKey, actionItems) {
            if (viewKey === this.viewKey) {
                this.statusBarItems = actionItems.filter(action => action.showInStatusBar);
            }
        },
        showMenuItems(event) {
            let viewKey = this.viewProvider.getViewContext && this.viewProvider.getViewContext().getViewKey();
            let applicableViewMenuItems;

            if (viewKey) {
                applicableViewMenuItems = this.openmct.actions._applicableViewActions(viewKey);
            }

            let applicableObjectMenuItems = this.openmct.actions._applicableObjectActions(this.objectPath);
            let applicableMenuItems;

            if (!applicableViewMenuItems) {
                applicableMenuItems = applicableObjectMenuItems;
            } else if(!applicableObjectMenuItems) {
                applicableMenuItems = applicableViewMenuItems;
            } else {
                applicableObjectMenuItems.splice(1, 0, applicableViewMenuItems);
                applicableMenuItems = applicableObjectMenuItems;
            }

            this.openmct.menus.showMenu(event.x, event.y, applicableMenuItems);
        }
    }
};
</script>
