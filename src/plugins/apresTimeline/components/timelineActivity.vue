<template>
    <li 
        :style="activityStyle"
    >
        {{ name }}
    </li>
</template>
<script>
export default {
    inject: ['openmct'],
    props: {
        domainObject: {
            type: Object,
            required: true,
            default() {
                return  {
                    configuration: {}
                }
            }
        }
    },
    methods: {
        onDomainObjectChange(domainObject) {
            let configuration = domainObject.configuration;

            this.name = domainObject.name;
            this.start = configuration.startTime;
            this.end = configuration.endTime;
            this.color = configuration.color;
        }
    },
    computed: {
        activityStyle() {
            return {
                'backgroundColor': this.color,
                'width': `${(this.end - this.start) * 30}px`,
                'margin': '5px',
                'padding': '5px'
            };
        }
    },
    data() {
        let configuration = this.domainObject.configuration;

        return {
            name: this.domainObject.name,
            start: configuration.startTime,
            end: configuration.endTime,
            color: configuration.color
        }
    },
    mounted() {
        this.unsubscribeFromDomainObjectChanges = this.openmct.objects.observe(this.domainObject, '*', this.onDomainObjectChange);
    },
    beforeDestroy() {
        this.unsubscribeFromDomainObjectChanges();
    }
}
</script>
