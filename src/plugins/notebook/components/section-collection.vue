<template>
<ul class="c-list">
    <li v-for="section in sections"
        :key="section.id"
        class="c-list__item-h"
    >
        <sectionComponent ref="sectionComponent"
                          :section="section"
        />
    </li>
</ul>
</template>

<script>
import { EVENT_DELETE_SECTION, EVENT_RENAME_SECTION, EVENT_SELECT_SECTION, EVENT_UPDATE_SECTION } from '../notebook-constants';
import { deleteNotebookEntries } from '../utils/notebook-entries';
import { getDefaultNotebook, setDefaultNotebook } from '../utils/notebook-storage';
import sectionComponent from './section-component.vue';

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
        }
    },
    data() {
        return {
        }
    },
    watch: {
        sections(sections) {
            this.removeAllListeners();
            this.addListeners();
        }
    },
    mounted() {
        this.addListeners();
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
        deleteSection(id) {
            const section = this.sections.find(s => s.id === id);
            deleteNotebookEntries(this.openmct, this.domainObject, section);

            const selectedSection = this.sections.find(s => s.isSelected);
            const defaultNotebook = getDefaultNotebook();
            const defaultSection = defaultNotebook && defaultNotebook.section;
            const isSectionSelected = selectedSection && selectedSection.id === id;
            const isSectionDefault = defaultSection && defaultSection.id === id;
            const sections = this.sections.filter(s => s.id !== id);

            if (isSectionSelected) {
                sections.forEach(s => {
                    s.isSelected = false;
                    if (defaultSection && defaultSection.id === s.id) {
                        s.isSelected = true;
                    }
                });
            }

            if (isSectionDefault) {
                setDefaultNotebook(this.domainObject, null, null);
            }

            if (isSectionSelected && isSectionDefault && sections.length) {
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
