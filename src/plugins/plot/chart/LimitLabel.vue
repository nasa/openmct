<template>
<div class="plot-series-limit-label c-plot-limit-label"
     :style="styleObj"
     :class="limit.cssClass"
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
        }
    }
};
</script>
