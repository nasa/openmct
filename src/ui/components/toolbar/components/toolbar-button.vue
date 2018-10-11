<template>
    <div class="c-ctrl-wrapper">
        <div class="c-click-icon"
            :class="{
                [options.icon]: true,
                'c-click-icon--caution': options.modifier === 'caution'
            }"
            @click="onClick">
            <div class="c-click-icon__label"
                 v-if="options.label">
                {{ options.label }}
            </div>

        </div>
    </div>
</template>

<script>
export default {
    props: {
        options: Object
    },
    methods: {
        onClick(event) {
            this.$emit('click', this.options);
        }
    }
}
</script>
