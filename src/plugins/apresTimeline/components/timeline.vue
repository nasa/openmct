<template>
  <div style="min-width: 100%">
        <ul style="min-width: 100%; min-height: 100%; position: relative;">
            <timeline-activity
                v-for="(activityDomainObject, index) in activities"
                :key="activityDomainObject.identifier.key"
                :domainObject="activityDomainObject"
                :index="index"
                :isEditing="isEditing"
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
        },
        reorderActivities(reorderPlan) {
            let oldActivities = this.activities.slice();

            reorderPlan.forEach((reorderEvent) => {
                this.$set(this.activities, reorderEvent.newIndex, oldActivities[reorderEvent.oldIndex]);
            });
        }
    },
    data() {
        return {
            activities: [],
            composition: this.openmct.composition.get(this.domainObject),
            activityHeight: 0
        }
    },
    mounted() {
        this.composition.on('add', this.addActivity);
        this.composition.on('remove', this.removeActivity);
        this.composition.on('reorder', this.reorderActivities);
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
