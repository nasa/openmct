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
        },
        getFillMenu(selectedParent, selection) {
            return {
                control: "color-picker",
                domainObject: selectedParent,
                applicableSelectedItems: selection.filter(selectionPath => {
                    let type = selectionPath[0].context.layoutItem.type;
                    return type === 'text-view' ||
                        type === 'telemetry-view' ||
                        type === 'box-view';
                }),
                property: function (selectionPath) {
                    return getPath(selectionPath) + ".fill";
                },
                icon: "icon-paint-bucket",
                title: "Set fill color"
            };
        },

        getStrokeMenu(selectedParent, selection) {
            return {
                control: "color-picker",
                domainObject: selectedParent,
                applicableSelectedItems: selection.filter(selectionPath => {
                    let type = selectionPath[0].context.layoutItem.type;
                    return type === 'text-view' ||
                        type === 'telemetry-view' ||
                        type === 'box-view' ||
                        type === 'image-view' ||
                        type === 'line-view';
                }),
                property: function (selectionPath) {
                    return getPath(selectionPath) + ".stroke";
                },
                icon: "icon-line-horz",
                title: "Set border color"
            };
        },

        getTextColorMenu(selectedParent, selection) {
            return {
                control: "color-picker",
                domainObject: selectedParent,
                applicableSelectedItems: selection.filter(selectionPath => {
                    let type = selectionPath[0].context.layoutItem.type;
                    return type === 'text-view' || type === 'telemetry-view';
                }),
                property: function (selectionPath) {
                    return getPath(selectionPath) + ".color";
                },
                icon: "icon-font",
                mandatory: true,
                title: "Set text color",
                preventNone: true
            };
        }
    }
}
</script>

