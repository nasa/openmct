/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
<div class="l-preview-window js-preview-window">
    <PreviewHeader
        :current-view="currentView"
        :action-collection="actionCollection"
        :domain-object="domainObject"
        :views="views"
    />
    <div class="l-preview-window__object-view js-notebook-snapshot-item">
        <div ref="objectView"></div>
    </div>
</div>
</template>

<script>
import PreviewHeader from './preview-header.vue';
import {STYLE_CONSTANTS} from "@/plugins/condition/utils/constants";
import StyleRuleManager from "@/plugins/condition/StyleRuleManager";

export default {
    components: {
        PreviewHeader
    },
    inject: [
        'openmct',
        'objectPath'
    ],
    props: {
        viewOptions: {
            type: Object,
            default() {
                return undefined;
            }
        },
        existingView: {
            type: Object,
            default() {
                return undefined;
            }
        }
    },
    data() {
        let domainObject = this.objectPath[0];

        return {
            domainObject: domainObject,
            viewKey: undefined,
            views: [],
            currentView: {},
            actionCollection: undefined,
            existingViewIndex: 0
        };
    },
    mounted() {
        this.views = this.openmct.objectViews.get(this.domainObject, this.objectPath).map((view, index) => {
            view.onItemClicked = () => {
                if (this.existingView && view.key === this.existingView.key) {
                    this.existingViewIndex = index;
                    this.showExistingView();
                } else {
                    this.setView(view);
                }
            };

            return view;
        });

        if (!this.existingView) {
            this.setView(this.views[0]);
        } else {
            this.showExistingView();
        }
    },
    beforeDestroy() {
        if (this.stopListeningStyles) {
            this.stopListeningStyles();
        }

        if (this.styleRuleManager) {
            this.styleRuleManager.destroy();
            delete this.styleRuleManager;
        }

        if (this.actionCollection) {
            this.actionCollection.destroy();
        }
    },
    destroyed() {
        if (!this.existingView) {
            this.view.destroy();
        } else if (this.existingViewElement) {
            // if the existing view element is populated, it's the currently viewed view
            // in preview and we need to add it back to the parent.
            this.addExistingViewBackToParent();
        }
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
            if (this.viewKey === view.key) {
                return;
            }

            // if there is an existing view element, then it's currently being viewed
            // we'll add it back to the parent in the meantime
            if (this.existingViewElement) {
                this.addExistingViewBackToParent();
            }

            this.clear();
            this.viewKey = view.key;
            this.currentView = view;
            this.initializeViewContainer();
            this.view = this.currentView.view(this.domainObject, this.objectPath);
            this.getActionsCollection(this.view);
            this.view.show(this.viewContainer, false, this.viewOptions);
            this.initObjectStyles();
        },
        showExistingView() {
            if (this.viewKey === this.existingView.key) {
                return;
            }

            this.clear();
            this.initializeViewContainer();

            this.currentView = this.views[this.existingViewIndex]; // this is for action collections and view switcher

            // save this for later, so it can be added back to the parent on destroy
            this.existingViewElement = this.existingView.parentElement.firstChild;

            this.viewKey = this.existingView.key;
            this.getActionsCollection(this.currentView);

            // this will use the existing DOM element for the view
            // removing it from it's existing parent
            this.viewContainer.appendChild(this.existingViewElement);
            this.initObjectStyles();

        },
        addExistingViewBackToParent() {
            this.existingView.parentElement.appendChild(this.existingViewElement);
            delete this.existingViewElement;
        },
        initializeViewContainer() {
            this.viewContainer = document.createElement('div');
            this.viewContainer.classList.add('l-angular-ov-wrapper');
            this.$refs.objectView.append(this.viewContainer);
        },
        getActionsCollection(view) {
            if (this.actionCollection) {
                this.actionCollection.destroy();
            }

            this.actionCollection = this.openmct.actions.getActionsCollection(this.objectPath, view);
        },
        initObjectStyles() {
            if (!this.styleRuleManager) {
                this.styleRuleManager = new StyleRuleManager((this.domainObject.configuration && this.domainObject.configuration.objectStyles), this.openmct, this.updateStyle.bind(this));
            } else {
                this.styleRuleManager.updateObjectStyleConfig(this.domainObject.configuration && this.domainObject.configuration.objectStyles);
            }

            if (this.stopListeningStyles) {
                this.stopListeningStyles();
            }

            this.stopListeningStyles = this.openmct.objects.observe(this.domainObject, 'configuration.objectStyles', (newObjectStyle) => {
                //Updating styles in the inspector view will trigger this so that the changes are reflected immediately
                this.styleRuleManager.updateObjectStyleConfig(newObjectStyle);
            });
        },
        updateStyle(styleObj) {
            if (!styleObj) {
                return;
            }

            let keys = Object.keys(styleObj);
            let firstChild = this.$refs.objectView.querySelector(':first-child');

            keys.forEach(key => {
                if (firstChild) {
                    if ((typeof styleObj[key] === 'string') && (styleObj[key].indexOf('__no_value') > -1)) {
                        if (firstChild.style[key]) {
                            firstChild.style[key] = '';
                        }
                    } else {
                        if (!styleObj.isStyleInvisible && firstChild.classList.contains(STYLE_CONSTANTS.isStyleInvisible)) {
                            firstChild.classList.remove(STYLE_CONSTANTS.isStyleInvisible);
                        } else if (styleObj.isStyleInvisible && !firstChild.classList.contains(styleObj.isStyleInvisible)) {
                            firstChild.classList.add(styleObj.isStyleInvisible);
                        }

                        firstChild.style[key] = styleObj[key];
                    }
                }
            });
        }
    }
};
</script>
