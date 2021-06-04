<template>
<div class="plot-series-limit-label c-plot-limit-label"
     :style="styleObj"
     :class="limitClass"
>
    <div class="c-plot-limit-label__label"
    >
        <span class="plot-series-limit-value">{{ limit.value }}</span>
        <span class="plot-series-color-swatch"
              :style="{ 'background-color': limit.color }"
        ></span>
        <span class="plot-series-name">{{ limit.name }}</span>
    </div>
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
            const top = `${this.point.top}px`;
            const left = `${this.point.left}px`;

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
