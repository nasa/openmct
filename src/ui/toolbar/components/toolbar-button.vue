<template>
    <div class="c-ctrl-wrapper">
        <div class="c-icon-button"
            :title="options.title"
            :class="{
                [options.icon]: true,
                'c-icon-button--caution': options.modifier === 'caution'
            }"
            @click="onClick">
            <div class="c-icon-button__label"
                 v-if="options.label">
                {{ options.label }}
            </div>

        </div>
    </div>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        options: Object
    },
    methods: {
        onClick(event) {
            if (this.options.dialog) {
                this.openmct.$injector.get('dialogService')
                .getUserInput(this.options.dialog, this.options.value)
                .then(value => {
                    this.$emit('change', {...value}, this.options);
                });
            }
            this.$emit('click', this.options);
        }
    }
}
</script>
