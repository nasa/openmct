<template>
<li
    @drop="emitDropEvent"
    @dragover="allowDrop"
>
    <div
        class="c-tree__item c-elements-pool__item"
        :class="{
            'is-context-clicked': contextClickActive
        }"
        draggable="true"
        @dragstart="emitDragStartEvent"
    >
        <span
            class="c-elements-pool__grippy c-grippy c-grippy--vertical-drag"
        ></span>
        <object-label
            :domain-object="elementObject"
            :object-path="[elementObject, parentObject]"
            @context-click-active="setContextClickState"
        />
    </div>
</li>
</template>

<script>
import ObjectLabel from '../components/ObjectLabel.vue';

export default {
    components: {
        ObjectLabel
    },
    props: {
        index: {
            type: Number,
            required: true,
            default: () => {
                return 0;
            }
        },
        elementObject: {
            type: Object,
            required: true,
            default: () => {
                return {};
            }
        },
        parentObject: {
            type: Object,
            required: true,
            default: () => {
                return {};
            }
        }
    },
    data() {
        return {
            contextClickActive: false
        };
    },
    methods: {
        allowDrop(event) {
            event.preventDefault();
        },
        emitDropEvent() {
            this.$emit('drop-custom', this.index);
        },
        emitDragStartEvent() {
            this.$emit('dragstart-custom', this.index);
        },
        setContextClickState(state) {
            this.contextClickActive = state;
        }
    }
};
</script>
