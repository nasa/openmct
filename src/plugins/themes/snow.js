import { installTheme } from './installTheme';

export default function plugin() {
  return function install(openmct) {
    installTheme(openmct, 'snow');
  };
}
