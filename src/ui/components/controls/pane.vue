<template>
    <div class="multipane__pane">
         <div v-if="splitter"
              class="multipane__splitter"
              :class="{
                  'multipane__splitter--before': splitter === 'before',
                  'multipane__splitter--after': splitter === 'after',
              }"
              @mousedown="start"
              ></div>
         <slot></slot>
    </div>
</template>

<script>
export default {
    props: {
        splitter: {
            type: String,
            validator: function (value) {
                return ['before', 'after'].indexOf(value) !== -1;
            }
        }
    },
    mounted() {
        this.type = this.$parent.type;
        this.trackSize();
    },
    methods: {
        trackSize: function() {
            if (this.type === 'vertical') {
                this.initial = this.$el.offsetHeight;
            } else if (this.type === 'horizontal') {
                this.initial = this.$el.offsetWidth;
            }
        },
        getPosition: function (event) {
            return this.type === 'horizontal' ?
                event.pageX :
                event.pageY;
        },
        getNewSize: function (event) {
            let delta = this.startPosition - this.getPosition(event);
            if (this.splitter === "before") {
                return `${this.initial + delta}px`;
            }
            if (this.splitter === "after") {
                return `${this.initial - delta}px`;
            }
        },
        updatePosition: function (event) {
            let size = this.getNewSize(event);
            if (this.type === 'horizontal') {
                this.$el.style.width = size;
            } else {
                this.$el.style.height = size;
            }
        },
        start: function (event) {
            this.startPosition = this.getPosition(event);
            document.body.addEventListener('mousemove', this.updatePosition);
            document.body.addEventListener('mouseup', this.end);
        },
        end: function (event) {
            document.body.removeEventListener('mousemove', this.updatePosition);
            document.body.removeEventListener('mouseup', this.end);
            this.trackSize();
        }
    }
}
</script>
