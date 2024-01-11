<!--
 Open MCT, Copyright (c) 2014-2024, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->

<template>
  <canvas
    ref="canvas"
    class="c-image-canvas"
    style="width: 100%; height: 100%"
    @mousedown="clearSelectedAnnotations"
    @mousemove="trackAnnotationDrag"
    @click="selectOrCreateAnnotation"
    @contextmenu="showContextMenu"
  ></canvas>
</template>

<script>
import Flatbush from 'flatbush';
import isEqual from 'lodash/isEqual';
import { toRaw } from 'vue';

import TagEditorClassNames from '../../inspectorViews/annotations/tags/TagEditorClassNames.js';

const EXISTING_ANNOTATION_STROKE_STYLE = '#D79078';
const EXISTING_ANNOTATION_FILL_STYLE = 'rgba(202, 202, 142, 0.2)';
const SELECTED_ANNOTATION_STROKE_COLOR = '#BD8ECC';
const SELECTED_ANNOTATION_FILL_STYLE = 'rgba(199, 87, 231, 0.2)';

const CONTEXT_MENU_ACTIONS = ['openImageInNewTab', 'saveImageAs'];

export default {
  inject: ['openmct', 'domainObject', 'objectPath', 'currentView'],
  props: {
    image: {
      type: Object,
      required: true
    },
    imageryAnnotations: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  emits: ['annotation-marquee-started', 'annotations-changed', 'annotation-marquee-finished'],
  data() {
    return {
      dragging: false,
      mouseDown: false,
      newAnnotationRectangle: {},
      keyString: null,
      context: null,
      canvas: null,
      selectedAnnotations: [],
      indexToAnnotationMap: {}
    };
  },
  computed: {
    annotationsIndex() {
      if (this.imageryAnnotations.length) {
        // create a flatbush index for the annotations
        const builtAnnotationsIndex = new Flatbush(this.imageryAnnotations.length);
        this.imageryAnnotations.forEach((annotation) => {
          const annotationRectangle = annotation.targets.find(
            (target) => target.keyString === this.keyString
          )?.rectangle;
          const annotationRectangleForPixelDepth =
            this.transformRectangleToPixelDense(annotationRectangle);
          const { x, y, x2, y2 } = this.transformAnnotationRectangleToFlatbushRectangle(
            annotationRectangleForPixelDepth
          );
          const indexNumber = builtAnnotationsIndex.add(x, y, x2, y2);
          this.indexToAnnotationMap[indexNumber] = annotation;
        });
        builtAnnotationsIndex.finish();

        return builtAnnotationsIndex;
      } else {
        return null;
      }
    }
  },
  watch: {
    imageryAnnotations: {
      handler() {
        this.drawAnnotations();
      },
      deep: true
    }
  },
  mounted() {
    this.canvas = this.$refs.canvas;
    this.context = this.canvas.getContext('2d');

    // adjust canvas size for retina displays
    const pixelScale = window.devicePixelRatio;
    this.canvas.width = Math.floor(this.canvas.width * pixelScale);
    this.canvas.height = Math.floor(this.canvas.height * pixelScale);

    this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
    this.openmct.selection.on('change', this.updateSelection);
    this.drawAnnotations();
  },
  beforeUnmount() {
    this.openmct.selection.off('change', this.updateSelection);
    document.body.removeEventListener('click', this.cancelSelection);
  },
  methods: {
    onAnnotationChange(updatedAnnotations) {
      updatedAnnotations.forEach((updatedAnnotation) => {
        // Try to find the annotation in the existing selected annotations
        const existingIndex = this.selectedAnnotations.findIndex((annotation) =>
          this.openmct.objects.areIdsEqual(annotation.identifier, updatedAnnotation.identifier)
        );

        // If found, update it
        if (existingIndex > -1) {
          this.selectedAnnotations[existingIndex] = updatedAnnotation;
        } else {
          // If not found, add it
          this.selectedAnnotations.push(updatedAnnotation);
        }
      });
      this.$emit('annotations-changed', this.selectedAnnotations);
    },
    transformAnnotationRectangleToFlatbushRectangle(annotationRectangle) {
      let { x, y, width, height } = annotationRectangle;
      let x2 = x + width;
      let y2 = y + height;

      // if height or width are negative, we need to adjust the x and y
      if (width < 0) {
        x2 = x;
        x = x + width;
      }
      if (height < 0) {
        y2 = y;
        y = y + height;
      }

      return { x, y, x2, y2 };
    },
    updateSelection(selection) {
      const selectionContext = selection?.[0]?.[0]?.context?.item;
      const selectionType = selection?.[0]?.[0]?.context?.type;
      const validSelectionTypes = ['clicked-on-image-selection'];

      if (!validSelectionTypes.includes(selectionType)) {
        // wrong type of selection
        return;
      }

      if (
        selectionContext &&
        this.openmct.objects.areIdsEqual(selectionContext.identifier, this.domainObject.identifier)
      ) {
        return;
      }

      const incomingSelectedAnnotations = selection?.[0]?.[0]?.context?.annotations;

      this.prepareExistingAnnotationSelection(incomingSelectedAnnotations);
    },
    prepareExistingAnnotationSelection(annotations) {
      const targetDetails = [];
      annotations.forEach((annotation) => {
        annotation.targets.forEach((target) => {
          // only add targetDetails if we haven't added it before
          const targetAlreadyAdded = targetDetails.some((targetDetail) => {
            return isEqual(targetDetail, toRaw(target));
          });
          if (!targetAlreadyAdded) {
            targetDetails.push(toRaw(target));
          }
        });
      });
      this.selectedAnnotations = annotations;
      this.drawAnnotations();

      return {
        targetDomainObjects: [this.domainObject],
        targetDetails
      };
    },
    clearSelectedAnnotations() {
      if (!this.openmct.annotation.getAvailableTags().length) {
        // don't bother with new annotations if there are no tags
        return;
      }

      this.mouseDown = true;
      this.selectedAnnotations = [];
    },
    /**
     * Given a rectangle, returns a rectangle that conforms to the pixel density of the device
     * @param {Object} rectangle without pixel density applied
     * @returns {Object} transformed rectangle with pixel density applied
     */
    transformRectangleToPixelDense(rectangle) {
      const pixelScale = window.devicePixelRatio;
      const transformedRectangle = {
        x: rectangle.x * pixelScale,
        y: rectangle.y * pixelScale,
        width: rectangle.width * pixelScale,
        height: rectangle.height * pixelScale
      };
      return transformedRectangle;
    },
    /**
     * Given a rectangle, returns a rectangle that is independent of the pixel density of the device
     * @param {Object} rectangle with pixel density applied
     * @returns {Object} transformed rectangle without pixel density applied
     */
    transformRectangleFromPixelDense(rectangle) {
      const pixelScale = window.devicePixelRatio;
      const transformedRectangle = {
        x: rectangle.x / pixelScale,
        y: rectangle.y / pixelScale,
        width: rectangle.width / pixelScale,
        height: rectangle.height / pixelScale
      };
      return transformedRectangle;
    },
    drawRectInCanvas(rectangle, fillStyle, strokeStyle) {
      this.context.beginPath();
      this.context.lineWidth = 1;
      this.context.fillStyle = fillStyle;
      this.context.strokeStyle = strokeStyle;
      this.context.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
      this.context.fill();
      this.context.stroke();
    },
    trackAnnotationDrag(event) {
      if (this.mouseDown && !this.dragging && event.shiftKey && event.altKey) {
        this.startAnnotationDrag(event);
      } else if (this.dragging) {
        const boundingRect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / boundingRect.width;
        const scaleY = this.canvas.height / boundingRect.height;
        this.newAnnotationRectangle = {
          x: this.newAnnotationRectangle.x,
          y: this.newAnnotationRectangle.y,
          width: (event.clientX - boundingRect.left) * scaleX - this.newAnnotationRectangle.x,
          height: (event.clientY - boundingRect.top) * scaleY - this.newAnnotationRectangle.y
        };
        this.drawAnnotations();
        this.drawRectInCanvas(
          this.newAnnotationRectangle,
          SELECTED_ANNOTATION_FILL_STYLE,
          SELECTED_ANNOTATION_STROKE_COLOR
        );
      }
    },
    clearCanvas() {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    selectImageView() {
      // should show ImageView itself if we have no annotations to display
      const selection = this.createPathSelection();
      this.openmct.selection.select(selection, true);
    },
    createSelection(annotation) {
      const selection = this.createPathSelection();
      selection[0].context = annotation;

      return selection;
    },
    selectImageAnnotations({ targetDetails, targetDomainObjects, annotations }) {
      const annotationContext = {
        type: 'clicked-on-image-selection',
        targetDetails,
        targetDomainObjects,
        annotations,
        annotationType: this.openmct.annotation.ANNOTATION_TYPES.PIXEL_SPATIAL,
        onAnnotationChange: this.onAnnotationChange
      };
      const selection = this.createPathSelection();
      if (
        selection.length &&
        this.openmct.objects.areIdsEqual(
          selection[0].context.item.identifier,
          this.domainObject.identifier
        )
      ) {
        selection[0].context = {
          ...selection[0].context,
          ...annotationContext
        };
      } else {
        selection.unshift({
          element: this.$el,
          context: {
            item: this.domainObject,
            ...annotationContext
          }
        });
      }

      this.openmct.selection.select(selection, true);

      document.body.addEventListener('click', this.cancelSelection);
    },
    cancelSelection(event) {
      if (this.$refs.canvas) {
        const clickedInsideCanvas = this.$refs.canvas.contains(event.target);
        // unfortunate side effect from possibly being detached from the DOM when
        // adding/deleting tags, so closest() won't work
        const clickedTagEditor = Object.values(TagEditorClassNames).some((className) => {
          return event.target.classList.contains(className);
        });
        const clickedInsideInspector = event.target.closest('.js-inspector') !== null;
        if (!clickedInsideCanvas && !clickedTagEditor && !clickedInsideInspector) {
          this.newAnnotationRectangle = {};
          this.selectedAnnotations = [];
          this.drawAnnotations();
        }
      }
    },
    createNewAnnotation() {
      this.dragging = false;
      this.selectedAnnotations = [];
      this.selectedAnnotations = [];
      this.$emit('annotation-marquee-finished');

      const rectangleFromCanvas = {
        x: this.newAnnotationRectangle.x,
        y: this.newAnnotationRectangle.y,
        width: this.newAnnotationRectangle.width,
        height: this.newAnnotationRectangle.height
      };
      const rectangleWithoutPixelScale = this.transformRectangleFromPixelDense(rectangleFromCanvas);
      const targetDetails = [
        {
          rectangle: rectangleWithoutPixelScale,
          time: this.image.time,
          keyString: this.keyString
        }
      ];
      this.selectImageAnnotations({
        targetDetails,
        targetDomainObjects: [this.domainObject],
        annotations: []
      });
    },
    attemptToSelectExistingAnnotation(event) {
      this.dragging = false;
      this.$emit('annotation-marquee-finished');
      // use flatbush to find annotations that are close to the click
      const boundingRect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / boundingRect.width;
      const scaleY = this.canvas.height / boundingRect.height;
      const x = (event.clientX - boundingRect.left) * scaleX;
      const y = (event.clientY - boundingRect.top) * scaleY;
      if (this.annotationsIndex) {
        let nearbyAnnotations = [];
        const resultIndicies = this.annotationsIndex.search(x, y, x, y);
        resultIndicies.forEach((resultIndex) => {
          const foundAnnotation = this.indexToAnnotationMap[resultIndex];
          nearbyAnnotations.push(foundAnnotation);
        });
        //if everything has been deleted, don't bother with the selection
        const allAnnotationsDeleted = nearbyAnnotations.every((annotation) => annotation._deleted);
        if (allAnnotationsDeleted) {
          nearbyAnnotations = [];
        }
        const { targetDomainObjects, targetDetails } =
          this.prepareExistingAnnotationSelection(nearbyAnnotations);
        this.selectImageAnnotations({
          targetDetails,
          targetDomainObjects,
          annotations: nearbyAnnotations
        });
      } else {
        // nothing selected
        this.drawAnnotations();
      }
    },
    selectOrCreateAnnotation(event) {
      event.stopPropagation();
      this.mouseDown = false;
      if (
        !this.dragging ||
        (!this.newAnnotationRectangle.width && !this.newAnnotationRectangle.height)
      ) {
        this.newAnnotationRectangle = {};
        this.attemptToSelectExistingAnnotation(event);
      } else {
        this.createNewAnnotation();
      }
    },
    createPathSelection() {
      let selection = [];
      selection.unshift({
        element: this.$el,
        context: {
          item: this.domainObject
        }
      });
      this.objectPath.forEach((pathObject, index) => {
        selection.push({
          element: this.openmct.layout.$refs.browseObject.$el,
          context: {
            item: pathObject
          }
        });
      });

      return selection;
    },
    startAnnotationDrag(event) {
      this.$emit('annotation-marquee-started');
      this.newAnnotationRectangle = {};
      const boundingRect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / boundingRect.width;
      const scaleY = this.canvas.height / boundingRect.height;
      this.newAnnotationRectangle = {
        x: (event.clientX - boundingRect.left) * scaleX,
        y: (event.clientY - boundingRect.top) * scaleY
      };
      this.dragging = true;
    },
    isSelectedAnnotation(annotation) {
      const someSelectedAnnotationExists = this.selectedAnnotations.some((selectedAnnotation) => {
        return this.openmct.objects.areIdsEqual(
          selectedAnnotation.identifier,
          annotation.identifier
        );
      });

      return someSelectedAnnotationExists;
    },
    drawAnnotations() {
      this.clearCanvas();
      let drawnRectangles = [];
      this.imageryAnnotations.forEach((annotation) => {
        if (annotation._deleted) {
          return;
        }
        const annotationRectangle = annotation.targets.find(
          (target) => target.keyString === this.keyString
        )?.rectangle;

        // Check if the rectangle has already been drawn
        const hasBeenDrawn = drawnRectangles.some(
          (drawnRect) =>
            drawnRect.x === annotationRectangle.x &&
            drawnRect.y === annotationRectangle.y &&
            drawnRect.width === annotationRectangle.width &&
            drawnRect.height === annotationRectangle.height
        );
        if (!hasBeenDrawn) {
          const rectangleForPixelDensity = this.transformRectangleToPixelDense(annotationRectangle);
          if (this.isSelectedAnnotation(annotation)) {
            this.drawRectInCanvas(
              rectangleForPixelDensity,
              SELECTED_ANNOTATION_FILL_STYLE,
              SELECTED_ANNOTATION_STROKE_COLOR
            );
          } else {
            this.drawRectInCanvas(
              rectangleForPixelDensity,
              EXISTING_ANNOTATION_FILL_STYLE,
              EXISTING_ANNOTATION_STROKE_STYLE
            );
          }
          drawnRectangles.push(annotationRectangle);
        }
      });
    },
    showContextMenu: function (event) {
      event.preventDefault();

      let objectPath = this.objectPath;

      const actions = CONTEXT_MENU_ACTIONS.map((key) => this.openmct.actions.getAction(key));
      const menuItems = this.openmct.menus.actionsToMenuItems(
        actions,
        objectPath,
        this.currentView
      );
      if (menuItems.length) {
        this.openmct.menus.showMenu(event.x, event.y, menuItems);
      }
    }
  }
};
</script>
