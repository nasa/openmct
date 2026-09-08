/*
Emits the precache manifest consumed by the Open MCT service worker
(src/plugins/pwa/serviceWorker.js).

After every asset of the compilation is known, this plugin writes an extra
`serviceWorkerManifest.js` asset of the form:

  self.__OPENMCT_PWA_MANIFEST__ = { version: '<compilation hash>', assets: [...] };

The service worker loads it with `importScripts`, precaches every listed asset
and uses the version to name its cache, so each build gets a fresh cache and a
changed manifest is what tells the browser a new service worker is available.
*/
import webpack from 'webpack';

const { Compilation, sources } = webpack;

const PLUGIN_NAME = 'ServiceWorkerManifestPlugin';
export const DEFAULT_MANIFEST_FILE_NAME = 'serviceWorkerManifest.js';
export const DEFAULT_SERVICE_WORKER_FILE_NAME = 'serviceWorker.js';

// Assets that are never worth precaching: they are either only used by
// developer tooling, or are the service worker files themselves, which the
// browser manages.
const DEFAULT_EXCLUDE = [/\.map$/, /\.LICENSE\.txt$/, /hot-update/];

export default class ServiceWorkerManifestPlugin {
  /**
   * @param {Object} [options]
   * @param {string} [options.fileName] Name of the emitted manifest asset.
   * @param {string} [options.serviceWorkerFileName] Name of the service worker asset.
   * @param {RegExp[]} [options.exclude] Additional asset name patterns to leave out.
   */
  constructor(options = {}) {
    this.fileName = options.fileName ?? DEFAULT_MANIFEST_FILE_NAME;
    this.serviceWorkerFileName = options.serviceWorkerFileName ?? DEFAULT_SERVICE_WORKER_FILE_NAME;
    this.exclude = [...DEFAULT_EXCLUDE, ...(options.exclude ?? [])];
  }

  /** @param {import('webpack').Compiler} compiler */
  apply(compiler) {
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: PLUGIN_NAME,
          // Late enough that every other plugin has emitted its assets.
          stage: Compilation.PROCESS_ASSETS_STAGE_ANALYSE
        },
        (assets) => {
          const manifest = {
            version: compilation.hash,
            assets: Object.keys(assets)
              .filter((name) => this.shouldPrecache(name))
              .sort()
          };
          const source = `self.__OPENMCT_PWA_MANIFEST__ = ${JSON.stringify(manifest, null, 2)};\n`;

          compilation.emitAsset(this.fileName, new sources.RawSource(source));
        }
      );
    });
  }

  /**
   * @param {string} assetName
   * @returns {boolean}
   */
  shouldPrecache(assetName) {
    if (assetName === this.fileName || assetName === this.serviceWorkerFileName) {
      return false;
    }

    return !this.exclude.some((pattern) => pattern.test(assetName));
  }
}
