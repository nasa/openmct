<template>
<div>
    <button @click="addSection">+ Add {{ sectionTitle }}</button>
    <ul>
        <li v-for="section in sections"
            :key="section.id"
        >
            <sectionComponent ref="sectionComponent"
                              :section="section"
            />
        </li>
    </ul>
</div>
</template>

<script>
import { EVENT_DELETE_SECTION, EVENT_RENAME_SECTION, EVENT_SELECT_SECTION, EVENT_UPDATE_SECTION } from '../notebook-constants';
import { deleteNotebookEntries } from '../utils/notebook-entries';
import { getDefaultNotebook, setDefaultNotebook } from '../utils/notebook-storage';
import sectionComponent from './section-component.vue';
import uuid from 'uuid';

export default {
    inject: ['openmct'],
    components: {
        sectionComponent
    },
    props: {
        domainObject: {
            type: Object,
            default() {
                return {};
            }
        },
        sections: {
            type: Array,
            required: true,
            default() {
                return [];
            }
        },
        sectionTitle: {
            type: String,
            default() {
                return '';
            }
        }
    },
    data() {
        return {
        }
    },
    computed: {
        selectedSession() {
            return this.sections.find(section => section.isSelected);
        }
    },
    watch: {
        sections(sections) {
            this.removeAllListeners();
            this.addListeners();

            if (!this.sections.length) {
                this.addSection();
            }
        }
    },
    mounted() {
        this.addListeners();

        if (!this.sections.length) {
            this.addSection();
        }
    },
    destroyed() {
        this.removeAllListeners();
    },
    methods: {
        addListeners() {
            setTimeout(() => {
                if (this.$refs.sectionComponent) {
                    this.$refs.sectionComponent.forEach(element => {
                        element.$on(EVENT_DELETE_SECTION, this.deleteSection);
                        element.$on(EVENT_RENAME_SECTION, this.updateSection);
                        element.$on(EVENT_SELECT_SECTION, this.selectSection);
                    });
                }
            }, 0);
        },
        removeAllListeners() {
            if (this.$refs.sectionComponent) {
                this.$refs.sectionComponent.forEach(element => element.$off());
            }
        },
        addSection() {
            const sectionTitle = this.sectionTitle;
            const id = uuid();
            const section = {
                id,
                isDefault : false,
                isSelected: true,
                name : `Unnamed ${sectionTitle}`,
                pages : [],
                sectionTitle
            };

            this.sections.forEach(s => s.isSelected = false);
            const sections = this.sections.concat(section);
            this.selectSection(id, sections);
        },
        deleteSection(id) {
            const section = this.sections.find(s => s.id === id);
            deleteNotebookEntries(this.openmct, this.domainObject, section);

            const selectedSession = this.sections.find(s => s.isSelected);
            const defaultNotebook = getDefaultNotebook();
            const defaultSection = defaultNotebook && defaultNotebook.section;
            const isSessionSelected = selectedSession && selectedSession.id === id;
            const isSessionDefault = defaultSection && defaultSection.id === id;
            const sections = this.sections.filter(s => s.id !== id);

            if (isSessionSelected) {
                sections.forEach(s => {
                    s.isSelected = false;
                    if (defaultSection && defaultSection.id === s.id) {
                        s.isSelected = true;
                    }
                });
            }

            if (isSessionDefault) {
                setDefaultNotebook(this.domainObject, null, null);
            }

            if (isSessionSelected && isSessionDefault && sections.length) {
                sections[0].isSelected = true;
            }

            this.$parent.$emit(EVENT_UPDATE_SECTION, { sections });
        },
        selectSection(id, newSections) {
            const currentSections = newSections || this.sections;
            const sections = currentSections.map(section => {
                const isSelected = section.id === id;
                section.isSelected = isSelected;

                return section;
            });
            this.$parent.$emit(EVENT_UPDATE_SECTION, { sections, id });
        },
        updateSection(newSection) {
            const sections = this.sections.map(section =>
                section.id === newSection.id
                    ? newSection
                    : section);
            this.$parent.$emit(EVENT_UPDATE_SECTION, { sections });
        }
    }
}
</script>
