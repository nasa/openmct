<template>
    <div class="c-tabs-view">
        <div class="c-tabs-view__tabs-holder c-compact-button-holder"
            :class="{
                'is-dragging': isDragging,
                'is-mouse-over': allowDrop
            }">
            <div class="c-drop-hint"
                 @drop="onDrop"
                 ref="dropHint">
            </div>
            <div class="c-tabs-view__empty-message"
                 v-if="!tabsList.length > 0">Drag objects here to add them to this view.</div>
            <button class="c-tabs-view__tab c-compact-button"
                v-for="(tab,index) in tabsList"
                :key="index"
                :class="[
                    {'is-current': tab=== currentTab}, 
                    tab.type.definition.cssClass
                ]"
                @click="showTab(tab)">
                <span class="c-button__label">{{tab.model.name}}</span>
            </button>
        </div>
        <div class="c-tabs-view__object-holder" 
            v-for="(object, index) in tabsList"
            :key="index"
            :class="{'invisible': object !== currentTab}">
            <div class="c-tabs-view__object-name l-browse-bar__object-name--w"
                 :class="currentTab.type.definition.cssClass">
                <div class="l-browse-bar__object-name">
                    {{currentTab.model.name}}
                </div>
            </div>
            <object-view class="c-tabs-view__object"
                :object="object.model">
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
            @include userSelectNone();
            flex: 0 0 auto;
            min-height: $h;
        }

        &__object-holder {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
        }

        &__object-name {
            flex: 0 0 auto;
            font-size: 1.2em !important;
            margin: $interiorMargin 0 $interiorMarginLg 0;
        }

        &__object {
            flex: 1 1 auto;
        }

        &__empty-message {
            color: rgba($colorBodyFg, 0.7);
            font-style: italic;
            text-align: center;
            line-height: $h;
            width: 100%;
        }
    }
</style>

<script>
import ObjectView from '../../../ui/components/layout/ObjectView.vue';

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
    mounted () {
        if (this.composition) {
            this.composition.on('add', this.addItem, this);
            this.composition.load();
        }

        document.addEventListener('dragstart', this.dragstart);
        document.addEventListener('dragend', this.dragend);

        let dropHint = this.$refs.dropHint;

        if (dropHint) {
            dropHint.addEventListener('dragenter', this.dragenter);
            dropHint.addEventListener('dragleave', this.dragleave);
        }
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
        showTab (tab) {
            this.currentTab = tab;
        },
        addItem (model) {
            let type = this.openmct.types.get(model.type) || unknownObjectType,
                tabItem = {
                    model,
                    type: type
                };

            this.tabsList.push(tabItem);

            if (this.setCurrentTab) {
                this.currentTab = tabItem;
                this.setCurrentTab = false;
            }
        },
        onDrop (e) {
            this.setCurrentTab = true;
        },
        dragstart (e) {
            if (e.dataTransfer.getData('domainObject')) {
                this.isDragging = true;
            }
        },
        dragend (e) {
            this.isDragging = false;
            this.allowDrop = false;
        },
        dragenter () {
            this.allowDrop = true;
        },
        dragleave() {
            this.allowDrop = false;
        }
    },
    destroyed() {
        this.composition.off('add', this.addItem, this);

        document.removeEventListener('dragstart', this.dragstart);
        document.removeEventListener('dragend', this.dragend);
    },
    beforeDestroy() {
        let dropHint = this.$refs.dropHint;

        dropHint.removeEventListener('dragenter', this.dragenter);
        dropHint.removeEventListener('dragleave', this.dragleave);
    }
}
</script>
