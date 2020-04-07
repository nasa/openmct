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
                          :non-specific="nonSpecific"
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
            nonSpecific: []
        }
    },
    destroyed() {
        this.removeListeners();
    },
    mounted() {
        this.items = [];
        this.previewAction = new PreviewAction(this.openmct);
        this.getObjectsAndItemsFromSelection();
        this.initializeStaticStyle();
        this.openmct.editor.on('isEditing', this.setEditState);
    },
    methods: {
        isItemType(type, item) {
            return item && (item.type === type);
        },
        getObjectsAndItemsFromSelection() {
            let domainObject;
            let subObjects = [];

            //multiple selection
            let itemInitialStyles = [];
            let itemStyle;
            this.selection.forEach((selectionItem) => {
                const item = selectionItem[0].context.item;
                const layoutItem = selectionItem[0].context.layoutItem;
                if (item && this.isItemType('subobject-view', layoutItem)) {
                    subObjects.push(item);
                    itemStyle = getInitialStyleForItem(item);
                } else {
                    domainObject = selectionItem[1].context.item;
                    itemStyle = getInitialStyleForItem(domainObject, layoutItem || item);
                    this.items.push({
                        id: layoutItem.id,
                        staticStyle: itemStyle
                    });
                }
                itemInitialStyles.push(itemStyle);
            });
            const {styles, nonSpecific} = getConsolidatedStyleValues(itemInitialStyles);
            this.initialStyles = styles;
            this.nonSpecific = nonSpecific;

            this.domainObject = domainObject;
            this.removeListeners();
            if (this.domainObject) {
                this.stopObserving = this.openmct.objects.observe(this.domainObject, '*', newDomainObject => this.domainObject = newDomainObject);
                this.stopObservingItems = this.openmct.objects.observe(this.domainObject, 'configuration.items', this.updateDomainObjectItemStyles);
            }

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
        updateStaticStyle(staticStyle, property) {
            //update the static style for each of the layoutItems as well as each sub object item
            this.staticStyle = staticStyle;
            this.persist(this.domainObject, this.getDomainObjectStyle(this.domainObject, property, this.items));
            if (this.domainObjectsById) {
                const keys = Object.keys(this.domainObjectsById);
                keys.forEach(key => {
                    let domainObject = this.domainObjectsById[key];
                    this.persist(domainObject, this.getDomainObjectStyle(domainObject, property));
                });
            }
        },
        getDomainObjectStyle(domainObject, property, items) {
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
                        if (property === key) {
                            itemStaticStyle[key] = this.staticStyle.style[key];
                        }
                    });
                    Object.assign(domainObjectStyles[item.id], { staticStyle: { style: itemStaticStyle } });
                });
            } else {
                //we're deconstructing here to ensure that if an item within a domainObject already had a style we don't lose it
                if (!domainObjectStyles.staticStyle) {
                    domainObjectStyles.staticStyle = {
                        style: {}
                    }
                }
                domainObjectStyles.staticStyle.style[property] = this.staticStyle.style[property];
            }

            return domainObjectStyles;
        },

        persist(domainObject, style) {
            this.openmct.objects.mutate(domainObject, 'configuration.objectStyles', style);
        }
    }
}
</script>
