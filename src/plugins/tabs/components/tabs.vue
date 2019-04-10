<template>
    <div class="c-tabs-view">
        <div class="c-tabs-view__tabs-holder c-tabs"
            :class="{
                'is-dragging': isDragging,
                'is-mouse-over': allowDrop
            }">
            <div class="c-drop-hint"
                 @drop="onDrop"
                 @dragenter="dragenter"
                 @dragleave="dragleave">
            </div>
            <div class="c-tabs-view__empty-message"
                 v-if="!tabsList.length > 0">Drag objects here to add them to this view.</div>
            <button class="c-tabs-view__tab c-tab"
                v-for="(tab,index) in tabsList"
                :key="index"
                :class="[
                    {'is-current': isCurrent(tab)},
                    tab.type.definition.cssClass
                ]"
                @click="showTab(tab)">
                <span class="c-button__label">{{tab.domainObject.name}}</span>
            </button>
        </div>
        <div class="c-tabs-view__object-holder"
            v-for="(tab, index) in tabsList"
            :key="index"
            :class="{'c-tabs-view__object-holder--hidden': !isCurrent(tab)}">
            <div v-if="currentTab"
                 class="c-tabs-view__object-name l-browse-bar__object-name--w"
                 :class="currentTab.type.definition.cssClass">
                <div class="l-browse-bar__object-name">
                    {{currentTab.domainObject.name}}
                </div>
            </div>
            <object-view class="c-tabs-view__object"
                :object="tab.domainObject">
            </object-view>
        </div>
    </div>
</template>

<style lang="scss">
    @import '~styles/sass-base.scss';

    .c-tabs-view {
        $h: 20px;
        @include abs();
        display: flex;
        flex-flow: column nowrap;

        > * + * {
            margin-top: $interiorMargin;
        }

        &__tabs-holder {
            min-height: $h;
        }

        &__tab {
            &:before {
                margin-right: $interiorMarginSm;
                opacity: 0.7;
            }
        }

        &__object-holder {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;

            &--hidden {
                height: 1000px;
                width: 1000px;
                position: absolute;
                left: -9999px;
                top: -9999px;
            }
        }

        &__object-name {
            flex: 0 0 auto;
            @include headerFont();
            font-size: 1.2em !important;
            margin: $interiorMargin 0 $interiorMarginLg 0;
        }

        &__object {
            display: flex;
            flex-flow: column nowrap;
            flex: 1 1 auto;
            height: 0; // Chrome 73 oveflow bug fix
        }

        &__empty-message {
            background: rgba($colorBodyFg, 0.1);
            color: rgba($colorBodyFg, 0.7);
            font-style: italic;
            text-align: center;
            line-height: $h;
            width: 100%;
        }
    }
</style>

<script>
import ObjectView from '../../../ui/components/ObjectView.vue';
import _ from 'lodash';

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
        dragstart (e) {
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
            return _.isEqual(this.currentTab, tab)
        }
    },
    mounted () {
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
    }
}
</script>
