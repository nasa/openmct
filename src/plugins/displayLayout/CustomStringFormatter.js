import printj from 'printj';

export default class CustomStringFormatter {
  constructor(openmct, valueMetadata, itemFormat) {
    this.openmct = openmct;

    this.itemFormat = itemFormat;
    this.valueMetadata = valueMetadata;
  }

  format(datum) {
    if (!this.itemFormat) {
      return;
    }

    if (!this.itemFormat.startsWith('&')) {
      return printj.sprintf(this.itemFormat, datum[this.valueMetadata.key]);
    }

    try {
      const key = this.itemFormat.slice(1);
      const customFormatter = this.openmct.telemetry.getFormatter(key);
      if (!customFormatter) {
        throw new Error('Custom Formatter not found');
      }

      return customFormatter.format(datum[this.valueMetadata.key]);
    } catch (e) {
      console.error(e);

      return datum[this.valueMetadata.key];
    }
  }

  setFormat(itemFormat) {
    this.itemFormat = itemFormat;
  }
}
