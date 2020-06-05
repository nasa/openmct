<template>
<div class="c-checkbox-menu js-checkbox-menu c-menu--to-left c-menu--has-close-btn">
    <ul
        @click="$event.stopPropagation()"
    >
        <li
            v-for="(layer, index) in layers"
            :key="index"
        >
            <input v-if="layer.visible"
                   :id="index + 'LayerControl'"
                   checked
                   type="checkbox"
                   @change="toggleLayerVisibility(index)"
            >
            <input v-else
                   :id="index + 'LayerControl'"
                   type="checkbox"
                   @change="toggleLayerVisibility(index)"
            >
            <label :for="index + 'LayerControl'">{{ layer.name }}</label>
        </li>
    </ul>

    <a class="s-icon-button icon-x t-btn-close c-switcher-menu__close-button"></a>
</div>
</template>

<script>

export default {
    inject: ['openmct'],
    props: {
        layers: {
            type: Array,
            default() {
                return []
            }
        }
    },
    methods: {
        toggleLayerVisibility(index) {
            this.$emit('toggleLayerVisibility', index);
        }
    }
}
</script>
