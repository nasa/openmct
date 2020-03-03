<template>
<div class="c-properties__row--span-all">
    <div class="controls">
        <div class="preview">ABC</div>
        <button class="c-icon-button--swatched icon-paint-bucket"
                data-style-prop="backgroundColor"
                @click="applyStyle"
        ></button>
        <button class="c-icon-button--swatched icon-line-horz"
                data-style-prop="borderColor"
                @click="applyStyle"
        ></button>
        <button class="c-icon-button--swatched icon-font"
                data-style-prop="color"
                @click="applyStyle"
        ></button>
    </div>
</div>
</template>

<script>

export default {
    name: 'ConditionalStylesView',
    inject: [
        'openmct'
    ],
    data() {
        return {
            backgroundColor: '#666',
            borderColor: '#000',
            color: '#ccc'
        }
    },
    methods: {
        applyStyle(ev) {
            const prop = ev.target.dataset.styleProp;
            const previewElem = ev.target.closest('.controls').querySelector('.preview')
            previewElem.style[`${prop}`] = this[prop];
        }
    }
}
</script>
