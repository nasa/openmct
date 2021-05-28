<template>
<div class="plot-series-limit-label"
     :style="styleObj"
     :class="limit.cssClass"
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
        }
    }
};
</script>
