<template>
<div :style="styleObj"
     class="c-plot-limit-line js-limit-line"
     :class="limitClass"
></div>
</template>

<script>
import { getLimitClass } from "./limitUtil";

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
            return getLimitClass(this.limit, 'c-plot-limit-line--');
        }
    }
};
</script>
