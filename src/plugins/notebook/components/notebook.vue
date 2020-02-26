<template>
<div class="c-notebook">
    <div class="c-notebook__head">
        <search class="c-notebook__search"
                :value="search"
                @input="search"
                @clear="search"
        />
    </div>
    <Multipane type="horizontal"
               class="c-notebook__multipane">
        <Pane class="c-notebook__nav">
            <Sidebar ref="sidebar"
                     :domain-object="internalDomainObject"
                     :page-title="internalDomainObject.configuration.pageTitle"
                     :pages="pages"
                     :section-title="internalDomainObject.configuration.sectionTitle"
                     :sections="sections"
            />
        </Pane>
        <Pane handle="before"
              class="c-notebook__contents">
            <div class="c-notebook__controls ">
                <div class="bread-crumb">
                    {{ getSelectedSection() ? getSelectedSection().name : '' }}
                    {{ getSelectedPage() ? getSelectedPage().name : '' }}
                </div>
                <div>
                    <select v-model="showTime"
                            class="c-notebook__controls__time"
                    >
                        <option value="0"
                                selected="selected"
                        >
                            Show all
                        </option>
                        <option value="1">Last hour</option>
                        <option value="8">Last 8 hours</option>
                        <option value="24">Last 24 hours</option>
                    </select>
                    <select v-model="defaultSort"
                            class="c-notebook__controls__time"
                    >
                        <option value="newest"
                                :selected="defaultSort === 'newest'"
                        >Newest first</option>
                        <option value="oldest"
                                :selected="defaultSort === 'oldest'"
                        >Oldest first</option>
                    </select>
                </div>
            </div>
            <div class="c-notebook__drag-area icon-plus"
                 @click="newEntry($event)"
                 @drop="newEntry($event)"
            >
                <span class="c-notebook__drag-area__label">To start a new entry, click here or drag and drop any object</span>
            </div>
            <div v-if="selectedSection && selectedPage"
                 class="c-notebook__entries"
            >
                <ul>
                    <NotebookEntry v-for="entry in filteredAndSortedEntries"
                                   :key="entry.key"
                                   :entry="entry"
                                   :domain-object="internalDomainObject"
                                   :selected-page="getSelectedPage()"
                                   :selected-section="getSelectedSection()"
                    />
                </ul>
            </div>
        </Pane>
    </Multipane>
</div>
</template>

<script>
import NotebookEntry from './notebook-entry.vue';
import Multipane from '@/ui/layout/multipane.vue';
import Pane from '@/ui/layout/pane.vue';
import Search from '@/ui/components/search.vue';
import Sidebar from './sidebar.vue';
import { getDefaultNotebook, setDefaultNotebook } from '../utils/notebook-storage';
import { addNotebookEntry, getNotebookEntries } from '../utils/notebook-entries';
import { EVENT_UPDATE_PAGE , EVENT_UPDATE_SECTION } from '../notebook-constants';

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        Multipane,
        NotebookEntry,
        Pane,
        Search,
        Sidebar
    },
    data() {
        return {
            defaultSort: this.domainObject.configuration.defaultSort,
            internalDomainObject: this.domainObject,
            search: '',
            showTime: 0
        }
    },
    computed: {
        filteredAndSortedEntries() {
            const pageEntries = getNotebookEntries(this.internalDomainObject, this.selectedSection, this.selectedPage) || [];

            return pageEntries.sort(this.sortEntries);
        },
        pages() {
            return this.getPages() || [];
        },
        sections() {
            return this.internalDomainObject.configuration.sections || [];
        },
        selectedPage() {
            const pages = this.getPages();
            if (!pages) {
                return null;
            }

            return pages.find(page => page.isSelected);
        },
        selectedSection() {
            if (!this.sections.length) {
                return null;
            }

            return this.sections.find(section => section.isSelected);
        }
    },
    mounted() {
        this.unlisten = this.openmct.objects.observe(this.internalDomainObject, '*', this.updateInternalDomainObject);
        this.$refs.sidebar.$on(EVENT_UPDATE_SECTION, this.updateSection.bind(this));
        this.$refs.sidebar.$on(EVENT_UPDATE_PAGE, this.updatePage.bind(this));
    },
    beforeDestroy() {
        if (this.unlisten) {
            this.unlisten();
        }

        this.$refs.sidebar.$off();
    },
    methods: {
        updateDefaultNotebook(selectedSection, selectedPage) {
            setDefaultNotebook(this.internalDomainObject, selectedSection, selectedPage);
        },
        getPages() {
            const selectedSection = this.getSelectedSection();
            if (!selectedSection || !selectedSection.pages.length) {
                return [];
            }

            return selectedSection.pages;
        },
        getSelectedPage() {
            const pages = this.getPages();
            if (!pages) {
                return null;
            }

            return pages.find(page => page.isSelected);
        },
        getSelectedSection() {
            if (!this.sections.length) {
                return null;
            }

            return this.sections.find(section => section.isSelected);
        },
        mutateObject(key, value) {
            this.openmct.objects.mutate(this.internalDomainObject, key, value);
        },
        newEntry(event) {
            const selectedSection = this.getSelectedSection();
            const selectedPage = this.getSelectedPage();
            this.search = '';

            this.updateDefaultNotebook(selectedSection, selectedPage);
            const notebookStorage = getDefaultNotebook();
            addNotebookEntry(this.openmct, this.internalDomainObject, notebookStorage);
        },
        sortEntries(right, left) {
            return this.defaultSort === 'newest'
                ? left.createdOn - right.createdOn
                : right.createdOn - left.createdOn;
        },
        updateInternalDomainObject(domainObject) {
            this.internalDomainObject = domainObject;
        },
        updatePage({ pages = [], id = null}) {
            const selectedSection = this.getSelectedSection();
            if (!selectedSection) {
                return;
            }

            selectedSection.pages = pages;
            const sections = this.sections.map(section => {
                if (section.id === selectedSection.id) {
                    section = selectedSection;
                }

                return section;
            });

            this.updateSection({ sections });
        },
        updateSection({ sections, id = null }) {
            this.mutateObject('configuration.sections', sections);
        }
    }
}
</script>
