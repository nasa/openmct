export const MY_ITEMS_KEY = 'mine';

export function createMyItemsIdentifier(namespace = '') {
  return {
    key: MY_ITEMS_KEY,
    namespace
  };
}
