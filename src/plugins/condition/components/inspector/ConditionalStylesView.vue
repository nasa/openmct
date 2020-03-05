<template>
<div class="c-properties__row--span-all">
    <div class="controls">
        <div class="preview">ABC</div>
        <button v-for="(item, index) in defaults"
                :key="index"
                class="c-icon-button--swatched"
                :class="item.iconClass"
                :data-style-prop="item.name"
                @click="applyStyle(index)"
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
            defaults: [
                {   name: 'backgroundColor',
                    iconClass: 'icon-paint-bucket',
                    value: '#666'
                },
                {   name: 'borderColor',
                    iconClass: 'icon-line-horz',
                    value: '#000'
                },
                {   name: 'color',
                    iconClass: 'icon-font',
                    value: '#ccc'
                }
            ]
        }
    },
    methods: {
        applyStyle(index) {
            const propName = event.target.dataset.styleProp;
            const previewElem = event.target.closest('.controls').querySelector('.preview')
            previewElem.style[`${propName}`] = this.defaults[index].value;
            event.target.setAttribute(`style`, `border-bottom: solid 2px ${this.defaults[index].value};`)
        }
    }
}
</script>

