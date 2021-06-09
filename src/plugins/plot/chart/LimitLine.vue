<template>
<hr :style="styleObj"
    :class="cssWithoutUprLwr"
>
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
        cssClass: {
            type: String,
            default() {
                return '';
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
        cssWithoutUprLwr() {
            let cssClass = this.cssClass.replace(/is-limit--upr/gi, 'is-limit--line');
            cssClass = cssClass.replace(/is-limit--lwr/gi, 'is-limit--line');

            return cssClass;
        }
    }
};
</script>
