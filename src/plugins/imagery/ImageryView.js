import mount from 'utils/mount';

import ImageryViewComponent from './components/ImageryView.vue';

const DEFAULT_IMAGE_FRESHNESS_OPTIONS = {
  fadeOutDelayTime: '0s',
  fadeOutDurationTime: '30s'
};
export default class ImageryView {
  constructor(openmct, domainObject, objectPath, options) {
    this.openmct = openmct;
    this.domainObject = domainObject;
    this.objectPath = objectPath;
    this.options = options;
    this.component = null;
    this._destroy = null;
  }

  show(element, isEditing, viewOptions) {
    let alternateObjectPath;
    let focusedImageTimestamp;
    if (viewOptions) {
      focusedImageTimestamp = viewOptions.timestamp;
      alternateObjectPath = viewOptions.objectPath;
    }

    const { vNode, destroy } = mount(
      {
        el: element,
        components: {
          'imagery-view': ImageryViewComponent
        },
        provide: {
          openmct: this.openmct,
          domainObject: this.domainObject,
          objectPath: alternateObjectPath || this.objectPath,
          imageFreshnessOptions: this.options?.imageFreshness || DEFAULT_IMAGE_FRESHNESS_OPTIONS,
          currentView: this
        },
        data() {
          return {
            focusedImageTimestamp
          };
        },
        template:
          '<imagery-view :focused-image-timestamp="focusedImageTimestamp" @update:focusedImageTimestamp="value => focusedImageTimestamp = value" ref="ImageryContainer"></imagery-view>'
      },
      {
        app: this.openmct.app,
        element
      }
    );
    this.component = vNode.componentInstance;
    this._destroy = destroy;
  }

  getViewContext() {
    if (!this.component) {
      return {};
    }

    return this.component.$refs.ImageryContainer;
  }

  pause() {
    const imageContext = this.getViewContext();
    // persist previous pause value to return to after unpausing
    this.previouslyPaused = imageContext.isPaused;
    imageContext.thumbnailClicked(imageContext.focusedImageIndex);
  }
  unpause() {
    const pausedStateBefore = this.previouslyPaused;
    this.previouslyPaused = undefined; // clear value
    const imageContext = this.getViewContext();
    imageContext.paused(pausedStateBefore);
  }

  onPreviewModeChange({ isPreviewing } = {}) {
    if (isPreviewing) {
      this.pause();
    } else {
      this.unpause();
    }
  }

  destroy() {
    if (this._destroy) {
      this._destroy();
    }
  }

  _getInstance() {
    return this.component;
  }
}
