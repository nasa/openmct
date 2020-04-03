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
<div class="l-preview-window">
    <div class="l-browse-bar">
        <div class="l-browse-bar__start">
            <div
                class="l-browse-bar__object-name--w"
                :class="type.cssClass"
            >
                <span class="l-browse-bar__object-name">
                    {{ domainObject.name }}
                </span>
                <context-menu-drop-down
                    :actions-to-be-skipped="actionsToBeSkipped"
                    :object-path="objectPath"
                />
            </div>
        </div>
        <div class="l-browse-bar__end">
            <div class="l-browse-bar__actions">
                <view-switcher
                    :views="views"
                    :current-view="currentView"
                    @setView="setView"
                />
            </div>
        </div>
    </div>
    <div class="l-preview-window__object-view">
        <div ref="objectView"></div>
    </div>
</div>
</template>

<script>
import ContextMenuDropDown from '../../ui/components/contextMenuDropDown.vue';
import ViewSwitcher from '../../ui/layout/ViewSwitcher.vue';

export default {
    components: {
        ContextMenuDropDown,
        ViewSwitcher
    },
    inject: [
        'openmct',
        'objectPath'
    ],
    data() {
        let domainObject = this.objectPath[0];
        let type = this.openmct.types.get(domainObject.type);

        return {
            actionsToBeSkipped: ['preview'],
            domainObject: domainObject,
            type: type,
            notebookEnabled: false,
            viewKey: undefined
        };
    },
    computed: {
        views() {
            return this
                .openmct
                .objectViews
                .get(this.domainObject);
        },
        currentView() {
            return this.views.filter(v => v.key === this.viewKey)[0] || {};
        }
    },
    mounted() {
        let view = this.openmct.objectViews.get(this.domainObject)[0];
        this.setView(view);
    },
    destroyed() {
        this.view.destroy();
    },
    methods: {
        clear() {
            if (this.view) {
                this.view.destroy();
                this.$refs.objectView.innerHTML = '';
            }
            delete this.view;
            delete this.viewContainer;
        },
        setView(view) {
            this.clear();

            this.viewKey = view.key;
            this.viewContainer = document.createElement('div');
            this.viewContainer.classList.add('u-angular-object-view-wrapper');
            this.$refs.objectView.append(this.viewContainer);

            this.view = this.currentView.view(this.domainObject, this.objectPath);
            this.view.show(this.viewContainer, false);
        }
    }
}
</script>
