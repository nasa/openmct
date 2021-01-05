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
        },
        index: {
            type: Number
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
                'position': 'absolute',
                'top': `${this.index * (this.activityHeight + 2)}px`,
                'left': `${this.start * 5}px`,
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
            color: configuration.color,
            activityHeight: 0
        }
    },
    mounted() {
        this.unsubscribeFromDomainObjectChanges = this.openmct.objects.observe(this.domainObject, '*', this.onDomainObjectChange);

        let boundingClientRect = this.$el.getBoundingClientRect();
        
        this.activityHeight = boundingClientRect.height;
    },
    beforeDestroy() {
        this.unsubscribeFromDomainObjectChanges();
    }
}
</script>
