<template>
    <div class="c-tabs-view">
        <div class="c-tabs-view__tabs-holder c-compact-button-holder">
            <button class="c-tabs-view__tab c-compact-button"
                v-for="(tab,index) in tabsList"
                :key="index"
                :class="[{'is-current': tab.model.identifier.key === currentObject.model.identifier.key}, tab.type.cssClass]"
                @click="setCurrentObject(tab)">
                <span class="c-button__label">{{tab.model.name}}</span>
            </button>
        </div>
        <div class="c-tabs-view__object-holder" 
            v-for="(object, index) in tabsList"
            :key="index"
            :class="{'invisible': object.model.identifier.key !== currentObject.model.identifier.key}">

            <div class="object-header flex-elem l-flex-row grows">
                <div class="type-icon flex-elem embed-icon holder" v-bind:class="currentObject.type.cssClass"></div>
                <div class="title-label flex-elem holder flex-can-shrink">{{currentObject.model.name}}</div>
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
    data: function () {

        if (this.composition) {
            this.composition.load().then(this.loadItems.bind(this));
            this.composition.on('add', this.loadItems, this);
            this.composition.on('remove', this.loadItems, this);
        }

        return ({
            currentObject: {
                model: {
                    identifier: {}
                },
                type: {}
            },
            tabsList: []
        });
    },
    methods:{
        setCurrentObject (object) {
            this.currentObject = object;
        },
        loadItems (array) {
            if (Array.isArray(array)) {
                this.tabsList = [];
                
                array.forEach((model, index) => {
                    let type = this.openmct.types.get(model.type) || unknownObjectType;
                    
                    this.tabsList.push({
                        model: model,
                        type: type.definition
                    });

                    if (index === 0) {
                        this.currentObject = this.tabsList[index];
                    }
                });
            }
        }
    },
    destroyed() {
        this.composition.off('add', this.loadItems, this);
        this.composition.off('remove', this.loadItems, this);
    }
}
</script>
