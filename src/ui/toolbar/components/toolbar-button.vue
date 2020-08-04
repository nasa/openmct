<template>
<div class="c-ctrl-wrapper">
    <div
        class="c-icon-button"
        :title="options.title"
        :class="{
            [options.icon]: true,
            'c-icon-button--caution': options.modifier === 'caution',
            'c-icon-button--mixed': nonSpecific
        }"
        @click="onClick"
    >
        <div
            v-if="options.label"
            class="c-icon-button__label"
        >
            {{ options.label }}
        </div>
    </div>
</div>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        options: {
            type: Object,
            required: true
        }
    },
    computed: {
        nonSpecific() {
            return this.options.nonSpecific === true;
        }
    },
    methods: {
        onClick(event) {
            if ((this.options.isEditing === undefined || this.options.isEditing) && this.options.dialog) {
                this.openmct.$injector.get('dialogService')
                    .getUserInput(this.options.dialog, this.options.value)
                    .then(value => {
                        this.$emit('change', {...value}, this.options);
                    });
            }

            this.$emit('click', this.options);
        }
    }
};
</script>
