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
    <div class="c-inspect-styles__header">
        Object Style
    </div>
    <div class="c-inspect-styles__content">
        <div v-if="staticStyle"
             class="c-inspect-styles__style"
        >
            <style-editor class="c-inspect-styles__editor"
                          :style-item="staticStyle"
                          :is-editing="isEditing"
                          @persist="updateStaticStyle"
            />
        </div>
    </div>
</div>
</template>

<script>

import StyleEditor from "./StyleEditor.vue";
import PreviewAction from "@/ui/preview/PreviewAction.js";
import { getInitialStyleForItem, getConsolidatedStyleValues } from "@/plugins/condition/utils/styleUtils";

export default {
    name: 'MultiSelectStylesView',
    components: {
        StyleEditor
    },
    inject: [
        'openmct',
        'selection'
    ],
    data() {
        return {
            staticStyle: undefined,
            isEditing: this.openmct.editor.isEditing(),
            navigateToPath: ''
        }
    },
    destroyed() {
        this.removeListeners();
    },
    mounted() {
        this.items = [];
        this.previewAction = new PreviewAction(this.openmct);
        this.getDomainObjectFromSelection();
        this.initializeStaticStyle();
        this.openmct.editor.on('isEditing', this.setEditState);
    },
    methods: {
        getDomainObjectFromSelection() {
            let domainObject;
            let subObjects = [];

            //multiple selection
            let itemInitialStyles = [];
            let itemStyle;
            this.selection.forEach((selectionItem) => {
                const item = selectionItem[0].context.item;
                if (item && item.composition) {
                    subObjects.push(item);
                    itemStyle = getInitialStyleForItem(item);
                } else {
                    const layoutItem = selectionItem[0].context.layoutItem;
                    domainObject = selectionItem[1].context.item;
                    itemStyle = getInitialStyleForItem(domainObject, layoutItem || item);
                    this.items.push({
                        id: layoutItem.id,
                        staticStyle: itemStyle
                    });
                }
                itemInitialStyles.push(itemStyle);
            });
            this.initialStyles = getConsolidatedStyleValues(itemInitialStyles);

            this.domainObject = domainObject;
            this.removeListeners();
            this.stopObserving = this.openmct.objects.observe(this.domainObject, '*', newDomainObject => this.domainObject = newDomainObject);
            this.stopObservingItems = this.openmct.objects.observe(this.domainObject, 'configuration.items', this.updateDomainObjectItemStyles);

            subObjects.forEach(this.registerListener);
        },
        updateDomainObjectItemStyles(newItems) {
            //check that all items that have been styles still exist. Otherwise delete those styles
            let keys = Object.keys(this.domainObject.configuration.objectStyles);
            keys.forEach((key) => {
                if ((key !== 'styles') &&
                    (key !== 'staticStyle') &&
                    (key !== 'conditionSetIdentifier')) {
                    if (!(newItems.find(item => item.id === key))) {
                        this.removeItemStyles(key);
                    }
                }
            });
        },
        registerListener(domainObject) {
            let id = this.openmct.objects.makeKeyString(domainObject.identifier);

            if (!this.domainObjectsById) {
                this.domainObjectsById = {};
            }

            if (!this.domainObjectsById[id]) {
                this.domainObjectsById[id] = domainObject;
                this.observeObject(domainObject, id);
            }
        },
        observeObject(domainObject, id) {
            let unobserveObject = this.openmct.objects.observe(domainObject, '*', function (newObject) {
                this.domainObjectsById[id] = JSON.parse(JSON.stringify(newObject));
            }.bind(this));
            this.unObserveObjects.push(unobserveObject);
        },
        removeListeners() {
            if (this.stopObserving) {
                this.stopObserving();
            }
            if (this.stopObservingItems) {
                this.stopObservingItems();
            }
            if (this.unObserveObjects) {
                this.unObserveObjects.forEach((unObserveObject) => {
                    unObserveObject();
                });
            }
            this.unObserveObjects = [];
        },
        removeItemStyles(itemId) {
            let domainObjectStyles =  (this.domainObject.configuration && this.domainObject.configuration.objectStyles) || {};
            if (itemId && domainObjectStyles[itemId]) {
                domainObjectStyles[itemId] = undefined;
                delete domainObjectStyles[this.itemId];

                if (_.isEmpty(domainObjectStyles)) {
                    domainObjectStyles = undefined;
                }
                this.persist(this.domainObject, domainObjectStyles);
            }
        },
        setEditState(isEditing) {
            this.isEditing = isEditing;
        },
        navigateOrPreview(event) {
            // If editing, display condition set in Preview overlay; otherwise nav to it while browsing
            if (this.openmct.editor.isEditing()) {
                event.preventDefault();
                this.previewAction.invoke(this.objectPath);
            }
        },
        initializeStaticStyle() {
            this.staticStyle = {
                style: Object.assign({}, this.initialStyles)
            };
        },
        updateStaticStyle(staticStyle) {
            //update the static style for each of the layoutItems as well as each sub object item
            this.staticStyle = staticStyle;
            this.persist(this.domainObject, this.getDomainObjectStyle(this.domainObject, this.items));
            if (this.domainObjectsById) {
                const keys = Object.keys(this.domainObjectsById);
                keys.forEach(key => {
                    let domainObject = this.domainObjectsById[key];
                    this.persist(domainObject, this.getDomainObjectStyle(domainObject));
                });
            }
        },
        getDomainObjectStyle(domainObject, items) {
            let domainObjectStyles =  (domainObject.configuration && domainObject.configuration.objectStyles) || {};

            if (items) {
                items.forEach(item => {
                    let itemStaticStyle = {};
                    if (!domainObjectStyles[item.id]) {
                        domainObjectStyles[item.id] = {};
                    } else if (domainObjectStyles[item.id].staticStyle) {
                        itemStaticStyle = domainObjectStyles[item.id].staticStyle.style;
                    }
                    Object.keys(item.staticStyle).forEach(key => {
                        if (this.staticStyle.style[key]) {
                            itemStaticStyle[key] = this.staticStyle.style[key];
                        }
                    });
                    Object.assign(domainObjectStyles[item.id], { staticStyle: { style: itemStaticStyle } });
                });
            } else {
                //we're deconstructing here to ensure that if an item within a domainObject already had a style we don't lose it
                Object.keys(domainObjectStyles.staticStyle.style).forEach(key => {
                    if (this.staticStyle.style[key]) {
                        domainObjectStyles.staticStyle.style[key] = this.staticStyle.style[key];
                    }
                });
            }

            return domainObjectStyles;
        },
        getCondition(id) {
            return this.conditions ? this.conditions[id] : {};
        },

        persist(domainObject, style) {
            this.openmct.objects.mutate(domainObject, 'configuration.objectStyles', style);
        }
    }
}
</script>
