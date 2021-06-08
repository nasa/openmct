<template>
<div class="c-plot-limit"
     :style="styleObj"
     :class="limitClass"
>
    <div class="c-plot-limit__label">
        <span class="c-plot-limit__direction-icon"></span>
        <span class="c-plot-limit__severity-icon"></span>
        <span class="c-plot-limit__limit-value">{{ limit.value }}</span>
        <span class="c-plot-limit__series-color-swatch"
              :style="{ 'background-color': limit.seriesColor }"
        ></span>
        <span class="c-plot-limit__series-name">{{ limit.name }}</span>
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

            return {
                'top': top
            };
        },
        limitClass() {
            let cssClass = '';
            if (this.limit.color) {
                cssClass = `${cssClass} c-plot-limit--${this.limit.color}`;
            }

            if (this.limit.isUpper) {
                cssClass = `${cssClass} c-plot-limit--upr`;
            } else {
                cssClass = `${cssClass} c-plot-limit--lwr`;
            }

            if (this.limit.level) {
                cssClass = `${cssClass} c-plot-limit--${this.limit.level}`;
            }

            return cssClass;
        }
    }
};
</script>
