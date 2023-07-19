<!--
 Open MCT, Copyright (c) 2014-2023, United States Government
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
  <div
    ref="notebookEmbed"
    class="c-snapshot c-ne__embed"
    @mouseover.ctrl="showToolTip"
    @mouseleave="hideToolTip"
  >
    <div v-if="embed.snapshot" class="c-ne__embed__snap-thumb" @click="openSnapshot()">
      <img :src="thumbnailImage" />
    </div>
    <div class="c-ne__embed__info">
      <div class="c-ne__embed__name">
        <a class="c-ne__embed__link" :class="embed.cssClass" @click="navigateToItemInTime">{{
          embed.name
        }}</a>
        <button
          class="c-ne__embed__actions c-icon-button icon-3-dots"
          title="More options"
          @click.prevent.stop="showMenuItems($event)"
        ></button>
      </div>
      <div class="c-ne__embed__time">
        {{ createdOn }}
      </div>
    </div>
  </div>
</template>

<script>
import Moment from 'moment';
import PreviewAction from '../../../ui/preview/PreviewAction';
import RemoveDialog from '../utils/removeDialog';
import PainterroInstance from '../utils/painterroInstance';
import SnapshotTemplate from './snapshot-template.html';
import objectPathToUrl from '@/tools/url';
import mount from 'utils/mount';
import tooltipHelpers from '../../../api/tooltips/tooltipMixins';
import { updateNotebookImageDomainObject } from '../utils/notebook-image';
import ImageExporter from '../../../exporters/ImageExporter';

export default {
  mixins: [tooltipHelpers],
  inject: ['openmct', 'snapshotContainer'],
  props: {
    embed: {
      type: Object,
      default() {
        return {};
      }
    },
    isLocked: {
      type: Boolean,
      default() {
        return false;
      }
    },
    isSnapshotContainer: {
      type: Boolean,
      default() {
        return false;
      }
    },
    removeActionString: {
      type: String,
      default() {
        return 'Remove This Embed';
      }
    }
  },
  data() {
    return {
      menuActions: []
    };
  },
  computed: {
    createdOn() {
      return this.formatTime(this.embed.createdOn, 'YYYY-MM-DD HH:mm:ss');
    },
    thumbnailImage() {
      return this.embed.snapshot.thumbnailImage
        ? this.embed.snapshot.thumbnailImage.src
        : this.embed.snapshot.src;
    }
  },
  watch: {
    isLocked(value) {
      if (value === true) {
        let index = this.menuActions.findIndex((item) => item.id === 'removeEmbed');

        this.$delete(this.menuActions, index);
      }
    }
  },
  async mounted() {
    this.objectPath = [];
    await this.setEmbedObjectPath();
    this.addMenuActions();
    this.imageExporter = new ImageExporter(this.openmct);
  },
  methods: {
    showMenuItems(event) {
      const x = event.x;
      const y = event.y;

      const menuOptions = {
        menuClass: 'c-ne__embed__actions-menu',
        placement: this.openmct.menus.menuPlacement.TOP_RIGHT
      };

      this.openmct.menus.showSuperMenu(x, y, this.menuActions, menuOptions);
    },
    addMenuActions() {
      if (this.embed.snapshot) {
        const viewSnapshot = {
          id: 'viewSnapshot',
          cssClass: 'icon-camera',
          name: 'View Snapshot',
          description: 'View the snapshot image taken in the form of a jpeg.',
          onItemClicked: () => this.openSnapshot()
        };

        this.menuActions = [viewSnapshot];
      }

      const navigateToItem = {
        id: 'navigateToItem',
        cssClass: this.embed.cssClass,
        name: 'Navigate to Item',
        description: 'Navigate to the item with the current time settings.',
        onItemClicked: () => this.navigateToItem()
      };

      const navigateToItemInTime = {
        id: 'navigateToItemInTime',
        cssClass: this.embed.cssClass,
        name: 'Navigate to Item in Time',
        description: 'Navigate to the item in its time frame when captured.',
        onItemClicked: () => this.navigateToItemInTime()
      };

      const quickView = {
        id: 'quickView',
        cssClass: 'icon-eye-open',
        name: 'Quick View',
        description: 'Full screen overlay view of the item.',
        onItemClicked: () => this.previewEmbed()
      };

      this.menuActions = this.menuActions.concat([quickView, navigateToItem, navigateToItemInTime]);

      if (!this.isLocked) {
        const removeEmbed = {
          id: 'removeEmbed',
          cssClass: 'icon-trash',
          name: this.removeActionString,
          description: 'Permanently delete this embed from this Notebook entry.',
          onItemClicked: this.getRemoveDialog.bind(this)
        };

        this.menuActions.push(removeEmbed);
      }
    },
    async setEmbedObjectPath() {
      this.objectPath = await this.openmct.objects.getOriginalPath(
        this.embed.domainObject.identifier
      );

      if (
        this.objectPath.length > 0 &&
        this.objectPath[this.objectPath.length - 1].type === 'root'
      ) {
        this.objectPath.pop();
      }
    },
    annotateSnapshot() {
      const { vNode, destroy } = mount(
        {
          template: '<div id="snap-annotation"></div>'
        },
        {
          app: this.openmct.app
        }
      );

      const painterroInstance = new PainterroInstance(vNode.el, this.openmct);
      const annotateOverlay = this.openmct.overlays.overlay({
        element: vNode.el,
        size: 'large',
        dismissable: false,
        buttons: [
          {
            label: 'Cancel',
            callback: () => {
              painterroInstance.dismiss();
              annotateOverlay.dismiss();
            }
          },
          {
            label: 'Save',
            emphasis: true,
            callback: () => {
              painterroInstance.save((snapshotObject) => {
                annotateOverlay.dismiss();
                this.snapshotOverlay.dismiss();
                this.updateSnapshot(snapshotObject);
                this.openSnapshotOverlay(snapshotObject.fullSizeImage.src);
              });
            }
          }
        ],
        onDestroy: destroy
      });

      painterroInstance.intialize();

      const fullSizeImageObjectIdentifier = this.embed.snapshot.fullSizeImageObjectIdentifier;
      if (!fullSizeImageObjectIdentifier) {
        // legacy image data stored in embed
        painterroInstance.show(this.embed.snapshot.src);

        return;
      }

      if (this.isSnapshotContainer) {
        const snapshot = this.snapshotContainer.getSnapshot(this.embed.id);
        const fullSizeImageURL = snapshot.notebookImageDomainObject.configuration.fullSizeImageURL;
        painterroInstance.show(fullSizeImageURL);

        return;
      }

      this.openmct.objects.get(fullSizeImageObjectIdentifier).then((object) => {
        painterroInstance.show(object.configuration.fullSizeImageURL);
      });
    },
    navigateToItem() {
      const url = objectPathToUrl(this.openmct, this.objectPath);
      this.openmct.router.navigate(url);
    },
    navigateToItemInTime() {
      const hash = this.embed.historicLink;

      const bounds = this.openmct.time.bounds();
      const isTimeBoundChanged =
        this.embed.bounds.start !== bounds.start || this.embed.bounds.end !== bounds.end;
      const isFixedTimespanMode = !this.openmct.time.clock();

      let message = '';
      if (isTimeBoundChanged) {
        this.openmct.time.bounds({
          start: this.embed.bounds.start,
          end: this.embed.bounds.end
        });
        message = 'Time bound values changed';
      }

      if (!isFixedTimespanMode) {
        message = 'Time bound values changed to fixed timespan mode';
      }

      if (message.length) {
        this.openmct.notifications.alert(message);
      }

      if (this.openmct.editor.isEditing()) {
        this.previewEmbed();
      } else {
        const relativeHash = hash.slice(hash.indexOf('#'));
        const url = new URL(
          relativeHash,
          `${location.protocol}//${location.host}${location.pathname}`
        );
        this.openmct.router.navigate(url.hash);
      }
    },
    formatTime(unixTime, timeFormat) {
      return Moment.utc(unixTime).format(timeFormat);
    },
    getRemoveDialog() {
      const options = {
        name: this.removeActionString,
        callback: this.removeEmbed.bind(this)
      };
      const removeDialog = new RemoveDialog(this.openmct, options);
      removeDialog.show();
    },
    openSnapshot() {
      const fullSizeImageObjectIdentifier = this.embed.snapshot.fullSizeImageObjectIdentifier;
      if (!fullSizeImageObjectIdentifier) {
        // legacy image data stored in embed
        this.openSnapshotOverlay(this.embed.snapshot.src);

        return;
      }

      if (this.isSnapshotContainer) {
        const snapshot = this.snapshotContainer.getSnapshot(this.embed.id);
        const fullSizeImageURL = snapshot.notebookImageDomainObject.configuration.fullSizeImageURL;
        this.openSnapshotOverlay(fullSizeImageURL);

        return;
      }

      this.openmct.objects.get(fullSizeImageObjectIdentifier).then((object) => {
        this.openSnapshotOverlay(object.configuration.fullSizeImageURL);
      });
    },
    openSnapshotOverlay(src) {
      const self = this;

      const { vNode, destroy } = mount(
        {
          data: () => {
            return {
              createdOn: this.createdOn,
              name: this.embed.name,
              cssClass: this.embed.cssClass,
              src
            };
          },
          methods: {
            formatTime: self.formatTime,
            annotateSnapshot: self.annotateSnapshot,
            exportImage: self.exportImage
          },
          template: SnapshotTemplate
        },
        {
          app: this.openmct.app
        }
      );

      this.snapshot = vNode.componentInstance;
      this.snapshotOverlay = this.openmct.overlays.overlay({
        element: vNode.el,
        onDestroy: destroy,
        size: 'large',
        autoHide: false,
        dismissable: true,
        buttons: [
          {
            label: 'Done',
            emphasis: true,
            callback: () => {
              this.snapshotOverlay.dismiss();
            }
          }
        ]
      });
    },
    exportImage(type) {
      let element = this.snapshot.$refs['snapshot-image'];

      if (type === 'png') {
        this.imageExporter.exportPNG(element, this.embed.name);
      } else {
        this.imageExporter.exportJPG(element, this.embed.name);
      }
    },
    previewEmbed() {
      const self = this;
      const previewAction = new PreviewAction(self.openmct);
      this.openmct.objects
        .get(self.embed.domainObject.identifier)
        .then((domainObject) => previewAction.invoke([domainObject]));
    },
    removeEmbed(success) {
      if (!success) {
        return;
      }

      this.$emit('removeEmbed', this.embed.id);
    },
    updateEmbed(embed) {
      this.$emit('updateEmbed', embed);
    },
    updateSnapshot(snapshotObject) {
      this.embed.snapshot.thumbnailImage = snapshotObject.thumbnailImage;

      this.updateNotebookImageDomainObjectSnapshot(snapshotObject);
      this.updateEmbed(this.embed);
    },
    updateNotebookImageDomainObjectSnapshot(snapshotObject) {
      if (this.isSnapshotContainer) {
        const snapshot = this.snapshotContainer.getSnapshot(this.embed.id);

        snapshot.embedObject.snapshot.thumbnailImage = snapshotObject.thumbnailImage;
        snapshot.notebookImageDomainObject.configuration.fullSizeImageURL =
          snapshotObject.fullSizeImage.src;

        this.snapshotContainer.updateSnapshot(snapshot);
      } else {
        updateNotebookImageDomainObject(
          this.openmct,
          this.embed.snapshot.fullSizeImageObjectIdentifier,
          snapshotObject.fullSizeImage
        );
      }
    },
    async showToolTip() {
      const { BELOW } = this.openmct.tooltips.TOOLTIP_LOCATIONS;
      this.buildToolTip(
        await this.getObjectPath(this.embed.domainObject.identifier),
        BELOW,
        'notebookEmbed'
      );
    }
  }
};
</script>
