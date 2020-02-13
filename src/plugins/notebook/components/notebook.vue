<template>
<div class="c-notebook">
    <div class="c-notebook__head">
        <search class="c-notebook__search"
                :value="entrySearch"
                @input="search"
                @clear="search"
        />
        <div class="c-notebook__controls ">
            <select v-model="showTime"
                    class="c-notebook__controls__time"
            >
                <option value="0"
                        selected="selected"
                >Show all</option>
                <option value="1">Last hour</option>
                <option value="8">Last 8 hours</option>
                <option value="24">Last 24 hours</option>
            </select>
            <select v-model="sortEntries" 
                    class="c-notebook__controls__time"
            >
                <option value="newest"
                        :selected="sortEntries === 'newest'"
                >Newest first</option>
                <option value="oldest"
                        :selected="sortEntries === 'oldest'"
                >Oldest first</option>
            </select>
        </div>
    </div>
    <div class="c-notebook__drag-area icon-plus"
         @click="newEntry($event)"
         @drop="newEntry($event)">
        <span class="c-notebook__drag-area__label">To start a new entry, click here or drag and drop any object</span>
    </div>
    <div class="c-notebook__entries">
        <ul>
            <notebook-entry
                v-for="entry in filteredAndSortedEntries"
                :key="entry.key"
                :entry="entry"
            />
        </ul>
    </div>
</div>
</template>

<script>
export default {
    inject: ['openmct', 'domainObject'],
    data() {
        return {
        }
    },
    mounted() {
        console.log(this.openmct, this.domainObject);
    },
    destroyed() {
    },
    methods: {
    }
}
</script>
