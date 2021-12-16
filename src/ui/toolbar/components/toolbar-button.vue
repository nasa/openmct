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
            const self = this;

            if ((self.options.isEditing === undefined || self.options.isEditing) && self.options.dialog) {
                this.updateFormStructure();

                self.openmct.forms.showForm(self.options.dialog)
                    .then(changes => {
                        self.$emit('change', {...changes}, self.options);
                    })
                    .catch(e => {
                        // canceled, do nothing
                    });
            }

            self.$emit('click', self.options);
        },
        updateFormStructure() {
            if (!this.options.value) {
                return;
            }

            Object.entries(this.options.value).forEach(([key, value]) => {
                this.options.dialog.sections.forEach(section => {
                    section.rows.forEach(row => {
                        if (row.key === key) {
                            row.value = value;
                        }
                    });
                });
            });
        }
    }
};
</script>
