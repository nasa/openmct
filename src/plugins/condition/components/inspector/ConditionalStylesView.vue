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
<div class="c-inspector__styles c-inspect-styles">
    <template v-if="!conditionalStyles.length">
        <div class="c-inspect-styles__header">
            Object Style
        </div>
        <div class="c-inspect-styles__content">
            <style-editor class="c-inspect-styles__style-editor"
                          :style-item="defaultStyle"
            />
            <button
                id="addConditionSet"
                class="c-button c-button--major c-toggle-styling-button labeled"
                @click="addConditionSet"
            >
                <span class="c-cs-button__label">Use Conditional Styling...</span>
            </button>
        </div>
    </template>
    <template v-else>
        <div class="c-inspect-styles__header">
            Conditional Object Styles
        </div>
        <div class="c-inspect-styles__content c-inspect-styles__condition-set">
            <div v-if="conditionSetDomainObject"
                 class="c-object-label icon-conditional"
            >
                <span class="c-object-label__name">{{ conditionSetDomainObject.name }}</span>
            </div>
            <template v-if="isEditing">
                <button
                    id="changeConditionSet"
                    class="c-button labeled"
                    @click="addConditionSet"
                >
                    <span class="c-button__label">Change...</span>
                </button>

                <button class="c-click-icon icon-x"
                        title="Remove conditional styles"
                        @click="removeConditionSet"
                ></button>
            </template>
        </div>

        <div v-if="conditionsLoaded"
             class="c-inspect-styles__conditions"
        >
            <div v-for="conditionStyle in conditionalStyles"
                 :key="conditionStyle.conditionId"
                 class="c-inspect-styles__condition"
            >
                <condition-error :show-label="true"
                                 :condition="getCondition(conditionStyle.conditionId)"
                />
                <condition-description :show-label="true"
                                       :condition="getCondition(conditionStyle.conditionId)"
                />
                <style-editor class="c-inspect-styles__editor"
                              :style-item="conditionStyle"
                              :is-editing="isEditing"
                              @persist="updateConditionalStyle"
                />
            </div>
        </div>
    </template>
</div>
</template>

<script>

import StyleEditor from "./StyleEditor.vue";
import ConditionSetSelectorDialog from "./ConditionSetSelectorDialog.vue";
import ConditionDescription from "@/plugins/condition/components/ConditionDescription.vue";
import ConditionError from "@/plugins/condition/components/ConditionError.vue";
import Vue from 'vue';

export default {
    name: 'ConditionalStylesView',
    components: {
        ConditionDescription,
        ConditionError,
        StyleEditor
    },
    inject: [
        'openmct',
        'domainObject'
    ],
    props: {
        itemId: {
            type: String,
            default: ''
        },
        initialStyles: {
            type: Object,
            default() {
                return undefined;
            }
        }
    },
    data() {
        return {
            conditionalStyles: [],
            conditionSetDomainObject: undefined,
            defaultStyle: {
                conditionId: 'default',
                style: Object.assign({}, this.initialStyles)
            },
            isEditing: this.openmct.editor.isEditing(),
            conditions: undefined,
            conditionsLoaded: false,
            errors: {}
        }
    },
    destroyed() {
        this.openmct.editor.off('isEditing', this.setEditState);
    },
    mounted() {
        if (this.domainObject.configuration && this.domainObject.configuration.conditionalStyle) {
            let conditionalStyle = this.itemId ? this.domainObject.configuration.conditionalStyle[this.itemId] : this.domainObject.configuration.conditionalStyle;
            if (conditionalStyle) {
                if (conditionalStyle.conditionSetIdentifier) {
                    this.conditionalStyles = conditionalStyle.styles;
                    this.openmct.objects.get(conditionalStyle.conditionSetIdentifier).then(this.initialize);
                } else {
                    //something isn't right, there is no conditionSetIdentifier!
                    this.errors.conditionSet = true;
                }
            }
        }
        this.openmct.editor.on('isEditing', this.setEditState);
    },
    methods: {
        initialize(conditionSetDomainObject) {
            //If there are new conditions in the conditionSet we need to set those styles to default
            this.conditionSetDomainObject = conditionSetDomainObject;
            this.initializeConditionalStyles();
        },
        setEditState(isEditing) {
            this.isEditing = isEditing;
        },
        addConditionSet() {
            let conditionSetDomainObject;
            const handleItemSelection = (item) => {
                if (item) {
                    conditionSetDomainObject = item;
                }
            };
            const dismissDialog = (overlay, initialize) => {
                overlay.dismiss();
                if (initialize && conditionSetDomainObject) {
                    this.conditionSetDomainObject = conditionSetDomainObject;
                    this.conditionalStyles = [];
                    this.initializeConditionalStyles();
                }
            };
            let vm = new Vue({
                provide: {
                    openmct: this.openmct
                },
                components: {ConditionSetSelectorDialog},
                data() {
                    return {
                        handleItemSelection
                    }
                },
                template: '<condition-set-selector-dialog @conditionSetSelected="handleItemSelection"></condition-set-selector-dialog>'
            }).$mount();

            let overlay = this.openmct.overlays.overlay({
                element: vm.$el,
                size: 'small',
                buttons: [
                    {
                        label: 'OK',
                        emphasis: 'true',
                        callback: () => dismissDialog(overlay, true)
                    },
                    {
                        label: 'Cancel',
                        callback: () => dismissDialog(overlay, false)
                    }
                ],
                onDestroy: () => vm.$destroy()
            });
        },
        removeConditionSet() {
            this.conditionSetDomainObject = undefined;
            this.conditionalStyles = [];
            let domainObjectConditionalStyle =  (this.domainObject.configuration && this.domainObject.configuration.conditionalStyle) || {};
            if (this.itemId) {
                domainObjectConditionalStyle[this.itemId] = undefined;
                delete domainObjectConditionalStyle[this.itemId];
            } else {
                domainObjectConditionalStyle.conditionSetIdentifier = undefined;
                delete domainObjectConditionalStyle.conditionSetIdentifier;
                domainObjectConditionalStyle.styles = undefined;
                delete domainObjectConditionalStyle.styles;
            }
            if (_.isEmpty(domainObjectConditionalStyle)) {
                domainObjectConditionalStyle = undefined;
            }

            this.persist('configuration.conditionalStyle', domainObjectConditionalStyle);
        },
        initializeConditionalStyles() {
            if (!this.conditions) {
                this.conditions = {};
            }
            this.conditionSetDomainObject.configuration.conditionCollection.forEach((conditionConfiguration, index) => {
                this.conditions[conditionConfiguration.id] = conditionConfiguration;
                let foundStyle = this.findStyleByConditionId(conditionConfiguration.id);
                if (foundStyle) {
                    foundStyle.style = Object.assign({}, this.initialStyles, foundStyle.style);
                } else {
                    this.conditionalStyles.splice(index, 0, {
                        conditionId: conditionConfiguration.id,
                        style: Object.assign({}, this.initialStyles)
                    });
                }
            });
            this.conditionsLoaded = true;
            this.persist('configuration.conditionalStyle', this.getDomainObjectConditionalStyle());
        },
        findStyleByConditionId(id) {
            return this.conditionalStyles.find(conditionalStyle => conditionalStyle.conditionId === id);
        },
        updateConditionalStyle(conditionStyle) {
            let found = this.findStyleByConditionId(conditionStyle.conditionId);
            if (found) {
                found.style = conditionStyle.style;
                this.persist('configuration.conditionalStyle', this.getDomainObjectConditionalStyle());
            }
        },
        getDomainObjectConditionalStyle() {
            let conditionStyle = {
                conditionSetIdentifier: this.conditionSetDomainObject.identifier,
                styles: this.conditionalStyles
            };
            let domainObjectConditionalStyle =  (this.domainObject.configuration && this.domainObject.configuration.conditionalStyle) || {};

            if (this.itemId) {
                domainObjectConditionalStyle[this.itemId] = conditionStyle;
            } else {
                //we're deconstructing here to ensure that if an item within a domainObject already had a style we don't lose it
                domainObjectConditionalStyle = {
                    ...domainObjectConditionalStyle,
                    ...conditionStyle
                }
            }

            return domainObjectConditionalStyle;
        },
        getCondition(id) {
            return this.conditions ? this.conditions[id] : {};
        },
        persist(property, style) {
            this.openmct.objects.mutate(this.domainObject, property, style);
        }
    }
}
</script>
