<template>
<div class="c-tree__item">
    <li class="grid-row">
        <div class="grid-cell label"
             title="Options for future events."
        >{{ label }}</div>
        <div class="grid-cell value c-tree__item">
            <select v-model="index"
                    @change="updateForm('index')"
            >
                <option v-for="(activityOption, activityKey) in activitiesOptions"
                        :key="activityKey"
                        :value="activityKey"
                >{{ activityOption }}</option>
            </select>
            <input v-if="index === 2"
                   v-model="duration"
                   class="c-input--flex"
                   type="text"
                   @change="updateForm('duration')"
            >
            <select v-if="index === 2"
                    v-model="durationIndex"
                    @change="updateForm('durationIndex')"
            >
                <option v-for="(durationOption, durationKey) in durationOptions"
                        :key="durationKey"
                        :value="durationKey"
                >{{ durationOption }}</option>
            </select>
        </div>
    </li>
</div>
</template>

<script>
const ACTIVITIES_OPTIONS = [
    'Don\'t Show',
    'Show all',
    'That start within',
    'That ended within'
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
            durationOptions: DURATION_OPTIONS
        };
    },
    mounted() {
        if (this.prefix === 'futureEvents') {
            this.activitiesOptions = ACTIVITIES_OPTIONS.slice(0, 3);
        } else if (this.prefix === 'pastEvents') {
            this.activitiesOptions = ACTIVITIES_OPTIONS.filter((item, index) => index !== 2);
        } else if (this.prefix === 'currentEvents') {
            this.activitiesOptions = ACTIVITIES_OPTIONS.slice(0, 2);
        }
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
        }
    }
};
</script>
