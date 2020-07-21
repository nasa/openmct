<template>
<div class="c-tabs-view">
    <div
        class="c-tabs-view__tabs-holder c-tabs"
        :class="{
            'is-dragging': isDragging && allowEditing,
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
            class="c-tab c-tabs-view__tab"
            :class="{
                'is-current': isCurrent(tab)
            }"
            @click="showTab(tab, index)"
        >
            <div class="c-object-label"
                 :class="{'is-missing': tab.domainObject.status === 'missing'}"
            >
                <div class="c-object-label__type-icon"
                     :class="tab.type.definition.cssClass"
                >
                    <span class="is-missing__indicator"
                          title="This item is missing"
                    ></span>
                </div>
                <span class="c-button__label c-object-label__name">{{ tab.domainObject.name }}</span>
            </div>
        </button>
    </div>
    <div
        v-for="(tab, index) in tabsList"
        :key="index"
        class="c-tabs-view__object-holder"
        :class="{'c-tabs-view__object-holder--hidden': !isCurrent(tab)}"
    >
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
import {
    getSearchParam,
    setSearchParam,
    deleteSearchParam
} from 'utils/openmctLocation';


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
    props: {
        isEditing: {
            type: Boolean,
            required: true
        }
    },
    data: function () {
        let keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

        return {
            internalDomainObject: this.domainObject,
            currentTab: {},
            currentTabIndex: undefined,
            tabsList: [],
            setCurrentTab: true,
            isDragging: false,
            allowDrop: false,
            searchTabKey: `tabs.pos.${keyString}`
        };
    },
    computed: {
        allowEditing() {
            return !this.internalDomainObject.locked && this.isEditing;
        }
    },
    mounted() {
        if (this.composition) {
            this.composition.on('add', this.addItem);
            this.composition.on('remove', this.removeItem);
            this.composition.on('reorder', this.onReorder);
            this.composition.load().then(() => {
                let currentTabIndexFromURL = getSearchParam(this.searchTabKey);
                let currentTabIndexFromDomainObject = this.internalDomainObject.currentTabIndex;

                if (currentTabIndexFromURL !== null) {
                    this.setCurrentTabByIndex(currentTabIndexFromURL);
                } else if (currentTabIndexFromDomainObject !== undefined) {
                    this.setCurrentTabByIndex(currentTabIndexFromDomainObject);
                    this.storeCurrentTabIndexInURL(currentTabIndexFromDomainObject);
                }
            });
        }

        this.unsubscribe = this.openmct.objects.observe(this.internalDomainObject, '*', this.updateInternalDomainObject);

        document.addEventListener('dragstart', this.dragstart);
        document.addEventListener('dragend', this.dragend);
    },
    beforeDestroy() {
        this.persistCurrentTabIndex(this.currentTabIndex);
    },
    destroyed() {
        this.composition.off('add', this.addItem);
        this.composition.off('remove', this.removeItem);
        this.composition.off('reorder', this.onReorder);

        this.unsubscribe();
        this.clearCurrentTabIndexFromURL();

        document.removeEventListener('dragstart', this.dragstart);
        document.removeEventListener('dragend', this.dragend);
    },
    methods:{
        setCurrentTabByIndex(index) {
            if (this.tabsList[index]) {
                this.currentTab = this.tabsList[index];
            }
        },
        showTab(tab, index) {
            if (index !== undefined) {
                this.storeCurrentTabIndexInURL(index);
            }

            this.currentTab = tab;
        },
        addItem(domainObject) {
            let type = this.openmct.types.get(domainObject.type) || unknownObjectType;
            let tabItem = {
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
        reset() {
            this.currentTab = {};
            this.setCurrentTab = true;
        },
        removeItem(identifier) {
            let pos = this.tabsList.findIndex(tab =>
                tab.domainObject.identifier.namespace === identifier.namespace && tab.domainObject.identifier.key === identifier.key
            );
            let tabToBeRemoved = this.tabsList[pos];

            this.tabsList.splice(pos, 1);

            if (this.isCurrent(tabToBeRemoved)) {
                this.showTab(this.tabsList[this.tabsList.length - 1], this.tabsList.length - 1);
            }

            if (!this.tabsList.length) {
                this.reset();
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
            this.storeCurrentTabIndexInURL(this.tabsList.length);
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
        persistCurrentTabIndex(index) {
            this.openmct.objects.mutate(this.internalDomainObject, 'currentTabIndex', index);
        },
        storeCurrentTabIndexInURL(index) {
            let currentTabIndexInURL = getSearchParam(this.searchTabKey);

            if (index !== currentTabIndexInURL) {
                setSearchParam(this.searchTabKey, index);
                this.currentTabIndex = index;
            }
        },
        clearCurrentTabIndexFromURL() {
            deleteSearchParam(this.searchTabKey);
        }
    }
}
</script>
