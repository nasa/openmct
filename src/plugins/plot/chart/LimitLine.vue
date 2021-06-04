<template>
<div :style="styleObj"
     class="c-plot-limit"
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
            const left = `${this.point.left}px`;

            return {
                'position': 'absolute',
                'width': '100%',
                'top': top,
                'left': left
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

            if (this.limit.level) {
                cssClass = `${cssClass} c-plot-limit--${this.limit.level}`;
            }

            return cssClass;
        }
    }
};
</script>
