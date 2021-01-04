<template>
<div
    ref="me"
    :style="{
        'top': virtualScroll ? itemTop : 'auto',
        'position': virtualScroll ? 'absolute' : 'relative'
    }"
    class="c-tree__item-h"
>
    <div
        class="c-tree__item"
    >
        <view-control
            v-model="expanded"
            class="c-tree__item__view-control"
            :control-class="'c-nav__up'"
            :enabled="showUp"
        />
        <object-label
            :domain-object="node.object"
            :object-path="node.objectPath"
            :navigate-to-path="''"
            :style="{ paddingLeft: leftOffset }"
            :lite-object="true"
            :before-interaction="onInteraction"
        />
        <view-control
            v-model="expanded"
            class="c-tree__item__view-control"
            :control-class="'c-nav__down'"
            :enabled="showDown"
        />
    </div>
</div>
</template>

<script>
import viewControl from '../components/viewControl.vue';
import ObjectLabel from '../components/ObjectLabel.vue';

export default {
    name: 'TreeItem',
    inject: ['openmct'],
    components: {
        viewControl,
        ObjectLabel
    },
    props: {
        node: {
            type: Object,
            required: true
        },
        leftOffset: {
            type: String,
            default: '0px'
        },
        showUp: {
            type: Boolean,
            default: false
        },
        showDown: {
            type: Boolean,
            default: true
        },
        itemIndex: {
            type: Number,
            required: false,
            default: undefined
        },
        itemOffset: {
            type: Number,
            required: false,
            default: undefined
        },
        itemHeight: {
            type: Number,
            required: false,
            default: 0
        },
        virtualScroll: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            expanded: false
        };
    },
    computed: {
        itemTop() {
            return (this.itemOffset + this.itemIndex) * this.itemHeight + 'px';
        }
    },
    methods: {
        async onInteraction() {
            let domainObject = await this.openmct.objects.get(this.node.object.identifier);
            let objectPath = await this.openmct.objects.getOriginalPath(this.node.object.identifier);
            objectPath.pop();

            return {
                domainObject,
                objectPath
            };
        }
    }
};
</script>
