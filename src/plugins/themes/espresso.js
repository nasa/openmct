import { installTheme } from './installTheme.js';

export default function plugin() {
  return function install(openmct) {
    installTheme(openmct, 'espresso');
  };
}
