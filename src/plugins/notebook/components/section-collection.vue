<template>
<div>
    <button @click="addSection">+ Add {{ domainObject.configuration.sectionTitle }}</button>
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
            required: true
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
        domainObject(newDomainObject) {
            this.sections = newDomainObject.sections;
        },
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
        addSection() {
            const sectionTitle = this.domainObject.configuration.sectionTitle;
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
            const sections = this.sections.filter(section => section.id !== id);

            if (sections.length) {
                // TODO: select isDefault section
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
