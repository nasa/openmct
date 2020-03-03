<template>
<div class="c-properties__row--span-all">
    <div class="controls">
        <div class="preview">ABC</div>
        <button class="c-icon-button--swatched icon-paint-bucket"
                @click="applyStyle('background-color')"
        ></button>
        <button class="c-icon-button--swatched icon-line-horz"
                @click="applyStyle('border')"
        ></button>
        <button class="c-icon-button--swatched icon-font"
                @click="applyStyle('color')"
        ></button>
    </div>
</div>
</template>

<script>
const previewElem = document.querySelector('.preview');

export default {
    name: 'ConditionalStylesView',
    inject: [
        'openmct'
    ],
    data() {
        return {
            backgroundColor: 'red',
            border: 'green',
            color: 'blue'
        }
    },
    methods: {
        applyStyle(type) {
            console.log('applyStyle', previewElem);
            previewElem.style[`${type}`] = this.backgroundColor;
        }
    }
}
</script>
