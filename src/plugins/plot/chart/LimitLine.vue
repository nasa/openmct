<template>
<div :style="styleObj"
     class="c-plot-limit-line"
     :class="limitClass"
></div>
</template>

<script>
export default {
    props: {
        point: {
            type: Object,
            required: true,
            default() {
                return {};
            }
        },
        limit: {
            type: Object,
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
                cssClass = `${cssClass} c-plot-limit-line--${this.limit.color}`;
            }

            if (this.limit.isUpper) {
                cssClass = `${cssClass} c-plot-limit-line--upper`;
            } else {
                cssClass = `${cssClass} c-plot-limit-line--lower`;
            }

            if (this.limit.level) {
                cssClass = `${cssClass} c-plot-limit-line--${this.limit.level}`;
            }

            return cssClass;
        }
    }
};
</script>
