<template>
<div
    class="l-layout__grid-holder"
    :class="{ 'c-grid': showGrid }"
>
    <div
        v-if="gridSize[0] >= 3"
        class="c-grid__x l-grid l-grid-x"
        :style="[{ backgroundSize: gridSize[0] + 'px 100%', width: gridDimensions[0] +'px', height: gridDimensions[1] +'px' }]"
    ></div>
    <div
        v-if="gridSize[1] >= 3"
        class="c-grid__y l-grid l-grid-y"
        :style="[{ backgroundSize: '100%' + gridSize[1] + 'px', width: gridDimensions[0] +'px', height: gridDimensions[1] +'px' }]"
    ></div>
</div>
</template>

<script>
export default {
    props: {
        gridSize: {
            type: Array,
            required: true,
            validator: (arr) => arr && arr.length === 2
                && arr.every(el => typeof el === 'number')
        },
        showGrid: {
            type: Boolean,
            required: true
        },
        gridDimensions: {
            type: Array,
            required: true,
            validator: (arr) => arr && arr.length === 2
                && arr.every(el => typeof el === 'number')
        }
    }
};
</script>
