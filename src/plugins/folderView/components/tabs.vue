<template>
    <div class="tabs-container">
        <div class="tabs-list">
            <div class="tab"
                v-for="(tab,index) in tabsList"
                :key="index"
                :class="{'selected': tab.identifier.key === currentObject.identifier.key}"
                @click="setCurrentObject(tab)"
            >
                {{tab.name}}
            </div>
        </div>
        <div class="object-view">
            <object-view 
                v-for="(object, index) in tabsList"
                :class="{'invisible': object.identifier.key !== currentObject.identifier.key}"
                :key="index"
                :object="object"
            >
            </object-view>
        </div>
    </div>
</template>

<style lang="scss">
.tabs-container {
    height: 100%;
    width: 100%;

    .tabs-list {
        display: flex;
        flex-wrap: wrap; 
        height: 20%;
        width: 100%;

        .tab {
            padding: 10px;
            background: #0099cc;
            border-radius: 5px;
            color: white;
            margin: 10px;

            &.selected {
                background: orange;
            }
        }
    }

    .object-view {
        min-height: 80%;
        width: 100%;

        .view {
            background: white;
            min-height: 100%;
        }
    }
}
</style>

<script>
import ObjectView from '../../../ui/components/layout/ObjectView.vue';

export default {
    inject: ['openmct','domainObject'],
    components: {
        ObjectView
    },
    data: function () {
        var composition = this.openmct.composition.get(this.domainObject),
            tabsList = [];

        if (composition) {
            composition.load().then((array) => {
                if (Array.isArray(array)) {
                    this.currentObject = array[0];

                    array.forEach((model) => {
                        tabsList.push(model);
                    });
                }
            });
        }

        return ({
            currentObject: {identifier:{}},
            tabsList
        });
    },
    methods:{
        setCurrentObject (object) {
            this.currentObject = object;
        }
    }
}
</script>
