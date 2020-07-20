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
    <PreviewHeader
        :current-view="currentView"
        :domain-object="domainObject"
        :views="views"
        @setView="setView"
    />
    <div class="l-preview-window__object-view">
        <div ref="objectView"></div>
    </div>
</div>
</template>

<script>
import PreviewHeader from './preview-header.vue';
import { STYLE_CONSTANTS } from "../../plugins/condition/utils/constants";
import StyleRuleManager from "../../plugins/condition/StyleRuleManager";

export default {
    components: {
        PreviewHeader
    },
    inject: [
        'openmct',
        'objectPath'
    ],
    data() {
        let domainObject = this.objectPath[0];

        return {
            domainObject: domainObject,
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
        if (this.stopListeningStyles) {
            this.stopListeningStyles();
        }

        if (this.styleRuleManager) {
            this.styleRuleManager.destroy();
            delete this.styleRuleManager;
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
            this.clear();

            this.viewKey = view.key;
            this.viewContainer = document.createElement('div');
            this.viewContainer.classList.add('u-angular-object-view-wrapper');
            this.$refs.objectView.append(this.viewContainer);

            this.view = this.currentView.view(this.domainObject, this.objectPath);
            this.view.show(this.viewContainer, false);
            this.initObjectStyles();
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
            keys.forEach(key => {
                let firstChild = this.$refs.objectView.querySelector(':first-child');
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
}
</script>
