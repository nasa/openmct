<template>
<div class="c-indicator c-indicator--clickable icon-notebook s-status-caution">
    <span class="label c-indicator__label">
        <button @click="globalToggleSnapshot">Snapshots</button>
    </span>
</div>
</template>

<script>
import SnapshotContainerComponent from './notebook-snapshot-container.vue';
import snapshotContainer from '../snapshot-container';
import Vue from 'vue';

export default {
    inject: ['openmct'],
    data() {
        return {
            expanded: false
        }
    },
    methods: {
        globalToggleSnapshot() {
            const self = this;

            if (this.expanded) {
                this.destroy();

                return;
            }

            this.expanded = true;
            const openmct = this.openmct;
            const destroy = self.destroy.bind(self);
            const drawer = document.querySelector('.l-shell__drawer');

            this.component = new Vue({
                provide: { openmct },
                components: {
                    SnapshotContainerComponent
                },
                data() {
                    return {
                        snapshots: snapshotContainer.getSnapshots() || [],
                        destroy
                    };
                },
                template: '<SnapshotContainerComponent :snapshots="snapshots" :destroy="destroy"></SnapshotContainerComponent>'
            }).$mount();

            drawer.appendChild(this.component.$el);
            drawer.classList.add('is-expanded');
        },
        destroy() {
            this.component.$destroy();
            const drawer = document.querySelector('.l-shell__drawer');
            drawer.classList.remove('is-expanded');
            const children = drawer.children;
            for (var child of children) {
                child.remove();
            }
            this.expanded = false;
        }
    }
}
</script>
