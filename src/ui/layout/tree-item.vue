<template>
  <li class="c-tree__item-h">
    <div
      class="c-tree__item"
      :class="{ 'is-alias': isAlias, 'is-navigated-object': isNavigated }"
    >
      <view-control
        v-model="expanded"
        class="c-tree__item__view-control"
        :enabled="hasChildren"
      />
      <object-label
        :domain-object="node.object"
        :object-path="node.objectPath"
        :navigate-to-path="navigateToPath"
      />
    </div>
    <ul
      v-if="expanded"
      class="c-tree"
    >
      <li
        v-if="isLoading && !loaded"
        class="c-tree__item-h"
      >
        <div class="c-tree__item loading">
          <span class="c-tree__item__label">Loading...</span>
        </div>
      </li>
      <tree-item
        v-for="child in children"
        :key="child.id"
        :node="child"
      />
    </ul>
  </li>
</template>

<script>
import viewControl from '../components/viewControl.vue';
import ObjectLabel from '../components/ObjectLabel.vue';

export default {
    name: 'TreeItem',
    inject: ['openmct'],
    components: {
        viewControl,
        ObjectLabel
    },
    props: {
        node: Object
    },
    data() {
        this.navigateToPath = this.buildPathString(this.node.navigateToParent)
        return {
            hasChildren: false,
            isLoading: false,
            loaded: false,
            isNavigated: this.navigateToPath === this.openmct.router.currentLocation.path,
            children: [],
            expanded: false
        }
    },
    computed: {
        isAlias() {
            let parent = this.node.objectPath[1];
            if (!parent) {
                return false;
            }
            let parentKeyString = this.openmct.objects.makeKeyString(parent.identifier);
            return parentKeyString !== this.node.object.location;
        }
    },
    watch: {
        expanded(isExpanded) {
            if (!this.hasChildren) {
                return;
            }
            if (!this.loaded && !this.isLoading) {
                this.composition = this.openmct.composition.get(this.domainObject);
                this.composition.on('add', this.addChild);
                this.composition.on('remove', this.removeChild);
                this.composition.load().then(this.finishLoading);
                this.isLoading = true;
            }
        }
    },
    mounted() {
        // TODO: should update on mutation.
        // TODO: click navigation should not fubar hash quite so much.
        // TODO: should highlight if navigated to.
        // TODO: should have context menu.
        // TODO: should support drag/drop composition
        // TODO: set isAlias per tree-item

        this.domainObject = this.node.object;
        let removeListener = this.openmct.objects.observe(this.domainObject, '*', (newObject) => {
            this.domainObject = newObject;
        });

        this.$once('hook:destroyed', removeListener);
        if (this.openmct.composition.get(this.node.object)) {
            this.hasChildren = true;
        }

        this.openmct.router.on('change:path', this.highlightIfNavigated);
    },
    destroyed() {
        this.openmct.router.off('change:path', this.highlightIfNavigated);
        if (this.composition) {
            this.composition.off('add', this.addChild);
            this.composition.off('remove', this.removeChild);
            delete this.composition;
        }
    },
    methods: {
        addChild(child) {
            this.children.push({
                id: this.openmct.objects.makeKeyString(child.identifier),
                object: child,
                objectPath: [child].concat(this.node.objectPath),
                navigateToParent: this.navigateToPath
            });
        },
        removeChild(identifier) {
            let removeId = this.openmct.objects.makeKeyString(identifier);
            this.children = this.children
                .filter(c => c.id !== removeId);
        },
        finishLoading() {
            this.isLoading = false;
            this.loaded = true;
        },
        buildPathString(parentPath) {
            return [parentPath, this.openmct.objects.makeKeyString(this.node.object.identifier)].join('/');
        },
        highlightIfNavigated(newPath, oldPath) {
            if (newPath === this.navigateToPath) {
                this.isNavigated = true;
            } else if (oldPath === this.navigateToPath) {
                this.isNavigated = false;
            }
        }
    }
}
</script>
