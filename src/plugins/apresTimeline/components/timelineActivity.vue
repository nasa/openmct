<template>
    <li 
        :style="activityStyle"
        @mousedown="onMouseDown"
    >
        {{ name }}
    </li>
</template>
<script>
const PIXEL_MULTIPLIER = 5;

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
        },
        isEditing: {
            type: Boolean
        }
    },
    computed: {
        activityStyle() {
            return {
                'position': 'absolute',
                'top': `${this.index * (this.activityHeight + 2)}px`,
                'left': `${this.start * PIXEL_MULTIPLIER}px`,
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
    methods: {
        onDomainObjectChange(domainObject) {
            let configuration = domainObject.configuration;

            this.name = domainObject.name;
            this.start = configuration.startTime;
            this.end = configuration.endTime;
            this.color = configuration.color;
        },
        onMouseDown(event) {
            if (!this.isEditing) {
                return;
            }
            event.preventDefault();
            document.addEventListener('mousemove', this.move);
            document.addEventListener('mouseup', this.endMove);

            this.clientX = event.clientX;
        },
        move(event) {
            let delta = (event.clientX - this.clientX) / PIXEL_MULTIPLIER;

            this.start += delta;
            this.end += delta;

            this.clientX = event.clientX;
        },
        endMove() {
            document.removeEventListener('mousemove', this.move);
            document.removeEventListener('mouseup', this.endMove);

            this.persistMove();
        },
        persistMove() {
            let configuration = {
                startTime: this.start,
                endTime: this.end,
                color: this.color
            };

            this.openmct.objects.mutate(this.domainObject, 'configuration', configuration);
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
