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
                <div class="l-browse-bar__object-name--w"
                    :class="type.cssClass">
                    <span class="l-browse-bar__object-name">
                        {{ domainObject.name }}
                    </span>
                    <context-menu-drop-down :object-path="objectPath"></context-menu-drop-down>
                </div>
            </div>
            <div class="l-browse-bar__end">
                <div class="l-browse-bar__actions">
                    <view-switcher
                        :views="views"
                        :currentView="currentView"
                        @setView="setView">
                    </view-switcher>
                    <button v-if="notebookEnabled"
                        class="l-browse-bar__actions__edit c-button icon-notebook"
                        title="New Notebook entry"
                        @click="snapshot">
                    </button>
                </div>
            </div>
        </div>
        <div class="l-preview-window__object-view">
            <div ref="objectView"></div>
        </div>
    </div>
</template>
<style lang="scss">

    .l-preview-window {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;

        > * + * {
            margin-top: $interiorMargin;
        }

        &__object-name {
            flex: 0 0 auto;
        }

        &__object-view {
            background: $colorBodyBg;
            border: 1px solid $colorInteriorBorder;
            flex: 1 1 auto;
            overflow: auto;
            padding: $interiorMargin;

            > div:not([class]) {
                // Target an immediate child div without a class and make it display: contents
                display: contents;
            }
        }
    }
</style>

 <script>
    import ContextMenuDropDown from '../../ui/components/contextMenuDropDown.vue';
    import ViewSwitcher from '../../ui/layout/ViewSwitcher.vue';
    import NotebookSnapshot from '../utils/notebook-snapshot';

    export default {
        components: {
            ContextMenuDropDown,
            ViewSwitcher
        },
        inject: [
            'openmct',
            'objectPath'
        ],
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
        methods: {
            snapshot() {
                let element = document.getElementsByClassName("l-preview-window__object-view")[0];
                this.notebookSnapshot.capture(this.domainObject, element);
            },
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
                this.viewContainer.classList.add('c-object-view','u-contents');
                this.$refs.objectView.append(this.viewContainer);

                this.view = this.currentView.view(this.domainObject, this.objectPath);
                this.view.show(this.viewContainer, false);
            }
        },
        data() {
            let domainObject = this.objectPath[0];
            let type = this.openmct.types.get(domainObject.type);

            return {
                domainObject: domainObject,
                type: type,
                notebookEnabled: false,
                viewKey: undefined
            };
        },
        mounted() {
            let view = this.openmct.objectViews.get(this.domainObject)[0];
            this.setView(view);

            if (this.openmct.types.get('notebook')) {
                this.notebookSnapshot = new NotebookSnapshot(this.openmct);
                this.notebookEnabled = true;
            }
        },
        destroyed() {
            this.view.destroy();
        }
    }
 </script>
