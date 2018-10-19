<template>
    <div class="c-tabs-view">
        <div class="c-tabs-view__tabs-holder">
            <button class="c-button icon-layout"
                v-for="(tab,index) in tabsList"
                :key="index"
                :class="{'is-current': tab.identifier.key === currentObject.identifier.key}"
                @click="setCurrentObject(tab)">
                <span class="c-button__label">{{tab.name}}</span>
            </button>
        </div>
        <div class="c-tabs-view__object-holder">
            <object-view class="u-contents"
                v-for="(object, index) in tabsList"
                :class="{'invisible': object.identifier.key !== currentObject.identifier.key}"
                :key="index"
                :object="object">
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
            background: rgba($colorBodyFg, 0.1);
            flex: 0 0 auto;
            display: flex;
            flex-flow: row wrap;
            padding: $interiorMarginSm;

            > * {
                $m: $interiorMarginSm;
                margin: 0 $m $m 0;
            }
        }

        &__object-holder {
            flex: 1 1 auto;
        }
    }
</style>

<script>
import ObjectView from '../../../ui/components/layout/ObjectView.vue';

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
            currentObject: {identifier:{}},
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
                this.currentObject = array[0];

                array.forEach((model) => {
                    this.tabsList.push(model);
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
