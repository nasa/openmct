<template>
<li class="c-inspect-properties__row">
    <div
        class="c-inspect-properties__label"
        title="Options for future events."
    >{{ label }}</div>
    <div
        v-if="canEdit"
        class="c-inspect-properties__value"
    >
        <select
            v-model="index"
            @change="updateForm('index')"
        >
            <option
                v-for="(activityOption, activityKey) in activitiesOptions"
                :key="activityKey"
                :value="activityKey"
            >{{ activityOption }}</option>
        </select>
        <input
            v-if="index === 2"
            v-model="duration"
            class="c-input c-input--sm"
            type="text"
            @change="updateForm('duration')"
        >
        <select
            v-if="index === 2"
            v-model="durationIndex"
            @change="updateForm('durationIndex')"
        >
            <option
                v-for="(durationOption, durationKey) in durationOptions"
                :key="durationKey"
                :value="durationKey"
            >{{ durationOption }}</option>
        </select>
    </div>
    <div
        v-else
        class="c-inspect-properties__value"
    >
        {{ activitiesOptions[index] }} <span v-if="index > 1">{{ duration }} {{ durationOptions[durationIndex] }}</span>
    </div>
</li>
</template>

<script>
const ACTIVITIES_OPTIONS = [
    'Don\'t show',
    'Show all',
    'Show starts within',
    'Show after end for'
];

const DURATION_OPTIONS = [
    'seconds',
    'minutes',
    'hours'
];

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        label: {
            type: String,
            required: true
        },
        prefix: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            index: this.domainObject.configuration[`${this.prefix}Index`],
            durationIndex: this.domainObject.configuration[`${this.prefix}DurationIndex`],
            duration: this.domainObject.configuration[`${this.prefix}Duration`],
            activitiesOptions: ACTIVITIES_OPTIONS,
            durationOptions: DURATION_OPTIONS,
            isEditing: this.openmct.editor.isEditing()
        };
    },
    computed: {
        canEdit() {
            return this.isEditing && !this.domainObject.locked;
        }
    },
    mounted() {
        if (this.prefix === 'futureEvents') {
            this.activitiesOptions = ACTIVITIES_OPTIONS.slice(0, 3);
        } else if (this.prefix === 'pastEvents') {
            this.activitiesOptions = ACTIVITIES_OPTIONS.filter((item, index) => index !== 2);
        } else if (this.prefix === 'currentEvents') {
            this.activitiesOptions = ACTIVITIES_OPTIONS.slice(0, 2);
        }

        this.openmct.editor.on('isEditing', this.setEditState);
    },
    beforeDestroy() {
        this.openmct.editor.off('isEditing', this.setEditState);
    },
    methods: {
        updateForm(property) {
            if (!this.isValid()) {
                return;
            }

            const capitalized = property.charAt(0).toUpperCase() + property.substr(1);
            this.$emit('updated', {
                property: `${this.prefix}${capitalized}`,
                value: this[property]
            });
        },
        isValid() {
            return this.index < 2 || (this.durationIndex >= 0 && this.duration > 0);
        },
        setEditState(isEditing) {
            this.isEditing = isEditing;
        }
    }
};
</script>
