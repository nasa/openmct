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
            @click="showTab(tab, index)"
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
            v-if="internalDomainObject.keep_alive ? currentTab : isCurrent(tab)"
            class="c-tabs-view__object"
            :object="tab.domainObject"
        />
    </div>
</div>
</template>

<script>
import ObjectView from '../../../ui/components/ObjectView.vue';

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
            internalDomainObject: this.domainObject,
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
            this.composition.load().then(() => {
                let currentTabIndex = this.domainObject.currentTabIndex;

                if (currentTabIndex !== undefined && this.tabsList.length > currentTabIndex) {
                    this.currentTab = this.tabsList[currentTabIndex];
                }
            });
        }

        this.unsubscribe = this.openmct.objects.observe(this.internalDomainObject, '*', this.updateInternalDomainObject);

        document.addEventListener('dragstart', this.dragstart);
        document.addEventListener('dragend', this.dragend);
    },
    destroyed() {
        this.composition.off('add', this.addItem);
        this.composition.off('remove', this.removeItem);
        this.composition.off('reorder', this.onReorder);

        this.unsubscribe();

        document.removeEventListener('dragstart', this.dragstart);
        document.removeEventListener('dragend', this.dragend);
    },
    methods:{
        showTab(tab, index) {
            if (index !== undefined) {
                this.storeCurrentTabIndex(index);
            }

            this.currentTab = tab;
        },
        addItem(domainObject) {
            let type = this.openmct.types.get(domainObject.type) || unknownObjectType,
                tabItem = {
                    domainObject,
                    type: type,
                    key: this.openmct.objects.makeKeyString(domainObject.identifier)
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
                this.showTab(this.tabsList[this.tabsList.length - 1], this.tabsList.length - 1);
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
            this.storeCurrentTabIndex(this.tabsList.length);
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
            return this.currentTab.key === tab.key;
        },
        updateInternalDomainObject(domainObject) {
            this.internalDomainObject = domainObject;
        },
        storeCurrentTabIndex(index) {
            this.openmct.objects.mutate(this.internalDomainObject, 'currentTabIndex', index);
        }
    }
};
</script>
