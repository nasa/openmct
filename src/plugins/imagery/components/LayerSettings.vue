<template>
<div
    class="c-control-menu c-menu--to-left c-menu--has-close-btn c-image-controls"
    @click="handleClose"
>
    <div class="c-checkbox-list js-checkbox-menu c-menu--to-left c-menu--has-close-btn">
        <ul
            @click="$event.stopPropagation()"
        >
            <li
                v-for="(layer, index) in layers"
                :key="index"
            >
                <input
                    v-if="layer.visible"
                    :id="index + 'LayerControl'"
                    checked
                    type="checkbox"
                    @change="toggleLayerVisibility(index)"
                >
                <input
                    v-else
                    :id="index + 'LayerControl'"
                    type="checkbox"
                    @change="toggleLayerVisibility(index)"
                >
                <label :for="index + 'LayerControl'">{{ layer.name }}</label>
            </li>
        </ul>
    </div>

    <button class="c-click-icon icon-x t-btn-close c-switcher-menu__close-button"></button>
</div>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        layers: {
            type: Array,
            default() {
                return [];
            }
        }
    },
    methods: {
        handleClose(e) {
            const closeButton = e.target.classList.contains('c-switcher-menu__close-button');
            if (!closeButton) {
                e.stopPropagation();
            }
        },
        toggleLayerVisibility(index) {
            this.$emit('toggleLayerVisibility', index);
        }
    }
};
</script>
