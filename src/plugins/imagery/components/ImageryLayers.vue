<template>
<div class="h-local-controls h-local-controls--overlay-content c-local-controls--show-on-hover l-flex-row c-imagery__lc"
     @click="$event.stopPropagation()"
>
    <div class="menu checkbox-menu">
        <ul class="c-inspect-properties__section">
            <li
                v-for="(layer, index) in layers"
                :key="index"
                class="c-inspect-properties__row"
            >
                <div class="c-inspect-properties__value">
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
                </div>
            </li>
        </ul>
    </div>
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
