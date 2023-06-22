const tooltipHelpers = {
  methods: {
    async getTelemetryPath(telemetryIdentifier) {
      let telemetryPathString = '';
      if (!this.domainObject?.identifier) {
        return;
      }
      const telemetryPath = await this.openmct.objects.getTelemetryPath(
        this.domainObject.identifier,
        telemetryIdentifier
      );
      if (telemetryPath.length) {
        telemetryPathString = telemetryPath.join(' / ');
      }
      return telemetryPathString;
    },
    async getObjectPath(objectIdentifier) {
      if (!objectIdentifier && !this.domainObject) {
        return;
      }
      const domainObjectIdentifier = objectIdentifier || this.domainObject.identifier;
      const objectPathList = await this.openmct.objects.getOriginalPath(domainObjectIdentifier);
      objectPathList.pop();
      return objectPathList
        .map((pathItem) => pathItem.name)
        .reverse()
        .join(' / ');
    },
    buildToolTip(tooltipText, tooltipLocation, elementRef) {
      if (!tooltipText || tooltipText.length < 1) {
        return;
      }
      this.tooltip = this.openmct.tooltips.tooltip({
        toolTipText: tooltipText,
        toolTipLocation: tooltipLocation,
        parentElement: this.$refs[elementRef]
      });
    },
    hideToolTip() {
      this.tooltip?.destroy();
      this.tooltip = null;
    }
  }
};

export default tooltipHelpers;
