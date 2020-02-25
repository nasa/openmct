<template>
<div class="c-notebook">
    <div class="c-notebook__head">
        <search class="c-notebook__search"
                :value="search"
                @input="search"
                @clear="search"
        />
    </div>
    <Multipane type="horizontal">
        <Pane>
            <Sidebar ref="sidebar"
                     :page-title="internalDomainObject.configuration.pageTitle"
                     :pages="pages"
                     :section-title="internalDomainObject.configuration.sectionTitle"
                     :sections="sections"
            />
        </Pane>
        <Pane handle="before">
            <div class="c-notebook__controls ">
                <div class="bread-crumb">
                    {{ getSelectedSession() ? getSelectedSession().name : '' }}
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
            <div v-if="selectedSession && selectedPage"
                 class="c-notebook__entries"
            >
                <ul>
                    <NotebookEntry v-for="entry in filteredAndSortedEntries"
                                   :key="entry.key"
                                   :entry="entry"
                                   :domain-object="internalDomainObject"
                                   :selected-page="getSelectedPage()"
                                   :selected-session="getSelectedSession()"
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
            defaultPageId: null,
            defaultSectionId: null,
            defaultSort: this.domainObject.configuration.defaultSort,
            internalDomainObject: this.domainObject,
            search: '',

            showTime: 0
        }
    },
    computed: {
        filteredAndSortedEntries() {
            return getNotebookEntries(this.internalDomainObject, this.selectedSession, this.selectedPage) || [];
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
        selectedSession() {
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

        this.updateSelectedSection();
        this.updateSelectedPage();
    },
    beforeDestroy() {
        if (this.unlisten) {
            this.unlisten();
        }

        this.$refs.sidebar.$off();
    },
    methods: {
        updateDefaultNotebook(selectedSection, selectedPage) {
            setDefaultNotebook(this, selectedSection, selectedPage);
        },
        getPages() {
            const selectedSession = this.getSelectedSession();
            if (!selectedSession || !selectedSession.pages.length) {
                return [];
            }

            return selectedSession.pages;
        },
        getSelectedPage() {
            const pages = this.getPages();
            if (!pages) {
                return null;
            }

            return pages.find(page => page.isSelected);
        },
        getSelectedSession() {
            if (!this.sections.length) {
                return null;
            }

            return this.sections.find(section => section.isSelected);
        },
        mutateObject(key, value) {
            this.openmct.objects.mutate(this.internalDomainObject, key, value);
        },
        newEntry(event) {
            const selectedSection = this.getSelectedSession();
            const selectedPage = this.getSelectedPage();
            this.search = '';

            this.updateDefaultNotebook(selectedSection, selectedPage);
            const notebookStorage = getDefaultNotebook();
            addNotebookEntry(this.openmct, this.internalDomainObject, notebookStorage);
        },
        updateInternalDomainObject(domainObject) {
            this.internalDomainObject = domainObject;
        },
        updatePage({ pages = [], id = null}) {
            const selectedSection = this.getSelectedSession();
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
        },
        updateSelectedPage() {
            const sections = this.getSelectedSession();
            if (!this.defaultSectionId || sections.length) {
                return;
            }

            const defaultSection = sections.find(section => section.id === this.defaultSectionId);
            if (!defaultSection) {
                return;
            }

            sections.forEach(section => {
                section.isSelected = (section.id === this.defaultSectionId);
            });

            this.updateSection(sections);
        },
        updateSelectedSection() {
            const pages = this.getPages();
            if (!this.defaultPageId || !pages.length) {
                return;
            }

            const defaultPage = pages.find(page => page.id === this.defaultPageId);
            if (!defaultPage) {
                return;
            }

            pages.forEach(page => {
                page.isSelected = (page.id === this.defaultPageId);
            });
            this.updatePage(pages);
        }
    }
}
</script>
