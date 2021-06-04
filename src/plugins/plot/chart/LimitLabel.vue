<template>
<div class="plot-series-limit-label"
     :style="styleObj"
     :class="limitClass"
>
    <span class="plot-series-limit-value">{{ limit.value }}</span>
    <span class="plot-series-color-swatch"
          :style="{ 'background-color': limit.color }"
    ></span>
    <span class="plot-series-name">{{ limit.name }}</span>
</div>
</template>

<script>
export default {
    props: {
        limit: {
            type: Object,
            required: true,
            default() {
                return {};
            }
        },
        point: {
            type: Object,
            required: true,
            default() {
                return {};
            }
        }
    },
    computed: {
        styleObj() {
            const top = `${this.point.top - 10}px`;
            const left = `${this.point.left + 5}px`;

            return {
                'position': 'absolute',
                'top': top,
                'left': left,
                'color': '#fff'
            };
        },
        limitClass() {
            let cssClass = '';
            if (this.limit.color) {
                cssClass = `${cssClass} c-plot-limit--${this.limit.color}`;
            }

            if (this.limit.isUpper) {
                cssClass = `${cssClass} c-plot-limit--upper`;
            } else {
                cssClass = `${cssClass} c-plot-limit--lower`;
            }

            return cssClass;
        }
    }
};
</script>
