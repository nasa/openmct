<template>
<div class="c-ctrl-wrapper">
    <div
        class="c-icon-button c-icon-button--menu"
        :class="[options.icon, {'c-click-icon--mixed': nonSpecific}]"
        :title="options.title"
        @click="toggle"
    >
        <div class="c-button__label">
            {{ selectedName }}
        </div>
    </div>
    <div
        v-if="open"
        class="c-menu"
    >
        <ul>
            <li
                v-for="option in options.options"
                :key="option.value"
                @click="select(option)"
            >
                {{ option.name || option.value }}
            </li>
        </ul>
    </div>
</div>
</template>

<script>
import toggleMixin from '../../mixins/toggle-mixin';

export default {
    mixins: [toggleMixin],
    props: {
        options: {
            type: Object,
            required: true,
            validator(value) {
                // must pass valid options array.
                return Array.isArray(value.options)
                    && value.options.every((o) => o.value);
            }
        }
    },
    computed: {
        selectedName() {
            let selectedOption = this.options.options.filter((o) => o.value === this.options.value)[0];
            if (selectedOption) {
                return selectedOption.name || selectedOption.value;
            }

            // If no selected option, then options are non-specific
            return '??';
        },
        nonSpecific() {
            return this.options.nonSpecific === true;
        }
    },
    methods: {
        select(option) {
            if (this.options.value === option.value) {
                return;
            }

            this.$emit('change', option.value, this.options);
        }
    }
};
</script>
