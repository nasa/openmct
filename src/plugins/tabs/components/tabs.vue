<template>
    <div class="c-tabs-view" 
         @drop="onDrop">
        <div class="c-tabs-view__tabs-holder c-compact-button-holder">
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

            <div class="object-header flex-elem l-flex-row grows">
                <div class="type-icon flex-elem embed-icon holder" 
                     :class="currentTab.type.definition.cssClass"></div>
                <div class="title-label flex-elem holder flex-can-shrink">
                    {{currentTab.model.name}}
                </div>
            </div>

            <object-view class="u-contents"
                :object="object.model">
            </object-view>
        </div>
    </div>
</template>

<style lang="scss">
    @import '~styles/sass-base.scss';

    .c-tabs-view {
        @include abs();
        display: flex;
        flex-flow: column nowrap;

        > * + * {
            margin-top: $interiorMargin;
        }

        &__tabs-holder {
        //    background: rgba($colorBodyFg, 0.1);
        //    border-radius: $controlCr;
            flex: 0 0 auto;
        //    display: flex;
        //    flex-flow: row wrap;
        //    padding: $interiorMarginSm;
         //   > * {
         //       $m: $interiorMarginSm;
         //       margin: 0 $m $m 0;
         //   }
        }

        //&__tab {
         //   @include discreteItem();
        //}

        &__object-holder {
            flex: 1 1 auto;
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
    },
    data: function () {
        return {
            currentTab: {},
            tabsList: []
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

            if (!this.currentTab.model) {
                this.currentTab = tabItem;
            }

            console.log(this.tabsList);
        },
        onDrop (e) {
           this.currentTab = {};
        }
    },
    destroyed() {
        this.composition.off('add', this.addItem, this);
    }
}
</script>
