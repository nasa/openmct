export const MY_ITEMS_KEY = 'mine';

export function createMyItemsIdentifier(namespace = '', key = MY_ITEMS_KEY) {
  return {
    key,
    namespace
  };
}
