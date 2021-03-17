<template>

<span>
    <span
        v-for="segment in segments"
        :key="segment.id"
        :style="getStyles(segment)"
        :class="{ [highlightClass] : segment.type === 'highlight' }"
    >
        {{ segment.text }}
    </span>
</span>

</template>

<script>

import uuid from 'uuid';

export default {
    props: {
        text: {
            type: String,
            required: true
        },
        highlight: {
            type: String,
            default() {
                return '';
            }
        },
        highlightClass: {
            type: String,
            default() {
                return 'highlight';
            }
        }
    },
    data() {
        return {
            segments: []
        };
    },
    watch: {
        highlight() {
            this.highlightText();
        }
    },
    mounted() {
        this.highlightText();
    },
    methods: {
        addHighlightSegment(segment) {
            this.segments.push({
                id: uuid(),
                text: segment,
                type: 'highlight',
                spaceBefore: segment.startsWith(' '),
                spaceAfter: segment.endsWith(' ')
            });
        },
        addTextSegment(segment) {
            this.segments.push({
                id: uuid(),
                text: segment,
                type: 'text',
                spaceBefore: segment.startsWith(' '),
                spaceAfter: segment.endsWith(' ')
            });
        },
        getStyles(segment) {
            let styles = {
                display: 'inline-block'
            };

            if (segment.spaceBefore) {
                styles.paddingLeft = '.33em';
            }

            if (segment.spaceAfter) {
                styles.paddingRight = '.33em';
            }

            return styles;
        },
        highlightText() {
            this.segments = [];
            let regex = new RegExp('(' + this.highlight + ')', 'gi');
            let textSegments = this.text.split(regex);

            for (let i = 0; i < textSegments.length; i++) {
                if (textSegments[i].toLowerCase() === this.highlight.toLowerCase()) {
                    this.addHighlightSegment(textSegments[i]);
                } else {
                    this.addTextSegment(textSegments[i]);
                }
            }
        }
    }
};
</script>
