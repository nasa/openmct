<template>
  <div style="min-width: 100%">
        <ul>
            <timeline-activity
                v-for="activityDomainObject in activities"
                :key="activityDomainObject.identifier.key"
                :domainObject="activityDomainObject"
            />
        </ul>
  </div>
</template>

<script>
import TimelineActivity from './timelineActivity.vue';

export default {
    inject: ['openmct', 'objectPath', 'domainObject'],
    props: {
        isEditing: {
            type: Boolean
        }
    },
    components: {
        TimelineActivity
    },
    methods: {
        addActivity(activityDomainObject) {
            this.activities.push(activityDomainObject);
        },
        removeActivity(activityIndentifier) {
            console.log(activityIndentifier);
        }
    },
    data() {
        return {
            activities: [],
            composition: this.openmct.composition.get(this.domainObject)
        }
    },
    mounted() {
        this.composition.on('add', this.addActivity);
        this.composition.on('remove', this.removeActivity);
        this.composition.load();
    },
    beforeDestroy() {
        this.composition.off('add', this.addActivity);
        this.composition.off('remove', this.removeActivity);
    }
}
</script>

<style lang="scss">
</style>