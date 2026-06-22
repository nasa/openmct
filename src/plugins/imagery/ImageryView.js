import mount from 'utils/mount';

import ImageryViewComponent from './components/ImageryView.vue';

const DEFAULT_IMAGE_FRESHNESS_OPTIONS = {
  fadeOutDelayTime: '0s',
  fadeOutDurationTime: '30s'
};

export default class ImageryView extends EventTarget {
  constructor(openmct, domainObject, objectPath, options) {
    super();

    this.openmct = openmct;
    this.domainObject = domainObject;
    this.objectPath = objectPath;
    this.options = options;
    this.component = null;
    this._destroy = null;
    this.viewContext = {};
  }

  show(element, isEditing, viewOptions) {
    const currentView = this;
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
          showCompassHUD: this.options?.showCompassHUD,
          currentView
        },
        data() {
          return {
            focusedImageTimestamp
          };
        },
        methods: {
          informListenersThatRelatedTelemetryIsAvailable() {
            currentView.dispatchEvent(new Event('related-telemetry-is-available'));
          }
        },
        template:
          '<imagery-view :focused-image-timestamp="focusedImageTimestamp" @update:focusedImageTimestamp="value => focusedImageTimestamp = value" @relatedTelemetryIsAvailable="informListenersThatRelatedTelemetryIsAvailable" ref="ImageryContainer"></imagery-view>'
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
    this.viewContext.imageUrl = this.component?.$refs.ImageryContainer.imageUrl;
    this.viewContext.viewImageHeading =
      this.component?.$refs.ImageryContainer.focusedImage?.heading;
    this.viewContext.viewImageCameraPan =
      this.component?.$refs.ImageryContainer.focusedImage?.cameraPan;
    this.viewContext.viewImageCameraTilt =
      this.component?.$refs.ImageryContainer.focusedImage?.cameraTilt;
    this.viewContext.viewImageSpacecraftZ =
      this.component?.$refs.ImageryContainer.focusedImage?.positionZ;

    return this.viewContext;
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
