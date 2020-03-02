<template>
<div class="l-multipane">
    <div>
        <button @click="navigateToSection()">
            {{ result.section.name }}
        </button>
        >
        <button @click="navigateToPage()">
            {{ result.page.name }}
        </button>
        <div>
            <span>{{ formatTime(result.entry.createdOn, 'YYYY-MM-DD') }}</span>
            <span>{{ formatTime(result.entry.createdOn, 'HH:mm:ss') }}</span>
        </div>
    </div>
    <div class="c-notebook__entries">
        <ul>
            <NotebookEntry :key="result.entry.key"
                           :entry="result.entry"
                           :read-only="true"
                           :selected-page="null"
                           :selected-section="null"
            />
        </ul>
    </div>
</div>
</template>

<script>
import { EVENT_CHANGE_SECTION_PAGE } from '../notebook-constants';
import NotebookEntry from './notebook-entry.vue';
import Moment from 'moment';

export default {
    inject: ['openmct'],
    components: {
        NotebookEntry
    },
    props:{
        result: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    watch: {
        result() {}
    },
    methods: {
        formatTime(unixTime, timeFormat) {
            return Moment(unixTime).format(timeFormat);
        },
        navigateToPage() {
            this.$parent.$emit(EVENT_CHANGE_SECTION_PAGE, { sectionId: this.result.section.id, pageId: this.result.page.id });
        },
        navigateToSection() {
            this.$parent.$emit(EVENT_CHANGE_SECTION_PAGE, { sectionId: this.result.section.id, pageId: null });
        }
    }
}
</script>
