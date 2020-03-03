<template>
<div class="c-indicator c-indicator--clickable icon-notebook s-status-caution">
    <span class="label c-indicator__label">
        <button @click="toggleSnapshot">Snapshots</button>
    </span>
</div>
</template>

<script>
import SnapshotContainerComponent from './notebook-snapshot-container.vue';
import Vue from 'vue';

export default {
    inject: ['openmct'],
    data() {
        return {
            expanded: false
        }
    },
    mounted() {
    },
    methods: {
        snapshotsUpdated() {
            this.updateSnapshotContainer();
        },
        toggleSnapshot() {
            this.expanded = !this.expanded;

            const drawerElement = document.querySelector('.l-shell__drawer');
            drawerElement.classList.toggle('is-expanded');

            this.updateSnapshotContainer();
        },
        updateSnapshotContainer() {
            const openmct = this.openmct;
            const toggleSnapshot = this.toggleSnapshot.bind(this);
            const drawerElement = document.querySelector('.l-shell__drawer');
            drawerElement.innerHTML = '<div></div';
            const divElement = document.querySelector('.l-shell__drawer div');

            this.component = new Vue({
                provide: { openmct },
                el: divElement,
                components: {
                    SnapshotContainerComponent
                },
                data() {
                    return {
                        toggleSnapshot
                    };
                },
                template: '<SnapshotContainerComponent :toggleSnapshot="toggleSnapshot"></SnapshotContainerComponent>'
            }).$mount();
        }
    }
}
</script>
