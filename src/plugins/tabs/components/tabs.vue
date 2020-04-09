<template>
<div class="c-tabs-view">
    <div
        class="c-tabs-view__tabs-holder c-tabs"
        :class="{
            'is-dragging': isDragging,
            'is-mouse-over': allowDrop
        }"
    >
        <div
            class="c-drop-hint"
            @drop="onDrop"
            @dragenter="dragenter"
            @dragleave="dragleave"
        ></div>
        <div
            v-if="!tabsList.length > 0"
            class="c-tabs-view__empty-message"
        >
            Drag objects here to add them to this view.
        </div>
        <button
            v-for="(tab,index) in tabsList"
            :key="index"
            class="c-tabs-view__tab c-tab"
            :class="[
                {'is-current': isCurrent(tab)},
                tab.type.definition.cssClass
            ]"
            @click="showTab(tab)"
        >
            <span class="c-button__label">{{ tab.domainObject.name }}</span>
        </button>
    </div>
    <div
        v-for="(tab, index) in tabsList"
        :key="index"
        class="c-tabs-view__object-holder"
        :class="{'c-tabs-view__object-holder--hidden': !isCurrent(tab)}"
    >
        <div
            v-if="currentTab"
            class="c-tabs-view__object-name c-object-label l-browse-bar__object-name--w"
            :class="currentTab.type.definition.cssClass"
        >
            <div class="l-browse-bar__object-name c-object-label__name">
                {{ currentTab.domainObject.name }}
            </div>
        </div>
        <object-view
            class="c-tabs-view__object"
            :object="tab.domainObject"
        />
    </div>
</div>
</template>

<script>
import ObjectView from '../../../ui/components/ObjectView.vue';
import isEqual from 'lodash/isEqual';

var unknownObjectType = {
    definition: {
        cssClass: 'icon-object-unknown',
        name: 'Unknown Type'
    }
};

export default {
    inject: ['openmct','domainObject', 'composition'],
    components: {
        ObjectView
    },
    data: function () {
        return {
            currentTab: {},
            tabsList: [],
            setCurrentTab: true,
            isDragging: false,
            allowDrop: false
        };
    },
    mounted() {
        if (this.composition) {
            this.composition.on('add', this.addItem);
            this.composition.on('remove', this.removeItem);
            this.composition.on('reorder', this.onReorder);
            this.composition.load();
        }

        document.addEventListener('dragstart', this.dragstart);
        document.addEventListener('dragend', this.dragend);
    },
    destroyed() {
        this.composition.off('add', this.addItem);
        this.composition.off('remove', this.removeItem);
        this.composition.off('reorder', this.onReorder);

        document.removeEventListener('dragstart', this.dragstart);
        document.removeEventListener('dragend', this.dragend);
    },
    methods:{
        showTab(tab) {
            this.currentTab = tab;
        },
        addItem(domainObject) {
            let type = this.openmct.types.get(domainObject.type) || unknownObjectType,
                tabItem = {
                    domainObject,
                    type: type
                };

            this.tabsList.push(tabItem);

            if (this.setCurrentTab) {
                this.currentTab = tabItem;
                this.setCurrentTab = false;
            }
        },
        removeItem(identifier) {
            let pos = this.tabsList.findIndex(tab =>
                    tab.domainObject.identifier.namespace === identifier.namespace && tab.domainObject.identifier.key === identifier.key
                ),
                tabToBeRemoved = this.tabsList[pos];

            this.tabsList.splice(pos, 1);

            if (this.isCurrent(tabToBeRemoved)) {
                this.showTab(this.tabsList[this.tabsList.length - 1]);
            }
        },
        onReorder(reorderPlan) {
            let oldTabs = this.tabsList.slice();

            reorderPlan.forEach(reorderEvent => {
                this.$set(this.tabsList, reorderEvent.newIndex, oldTabs[reorderEvent.oldIndex]);
            });
        },
        onDrop(e) {
            this.setCurrentTab = true;
        },
        dragstart(e) {
            if (e.dataTransfer.types.includes('openmct/domain-object-path')) {
                this.isDragging = true;
            }
        },
        dragend(e) {
            this.isDragging = false;
            this.allowDrop = false;
        },
        dragenter() {
            this.allowDrop = true;
        },
        dragleave() {
            this.allowDrop = false;
        },
        isCurrent(tab) {
            return isEqual(this.currentTab, tab)
        }
    }
}
</script>
