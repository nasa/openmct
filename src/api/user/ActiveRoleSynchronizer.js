import { ACTIVE_ROLE_BROADCAST_CHANNEL_NAME } from './constants';

class ActiveRoleSynchronizer {
  #roleChannel;

  constructor(openmct) {
    this.openmct = openmct;
    this.#roleChannel = new BroadcastChannel(ACTIVE_ROLE_BROADCAST_CHANNEL_NAME);
    this.setActiveRoleFromChannelMessage = this.setActiveRoleFromChannelMessage.bind(this);

    this.subscribeToRoleChanges(this.setActiveRoleFromChannelMessage);
  }
  subscribeToRoleChanges(callback) {
    this.#roleChannel.addEventListener('message', callback);
  }
  unsubscribeFromRoleChanges(callback) {
    this.#roleChannel.removeEventListener('message', callback);
  }

  setActiveRoleFromChannelMessage(event) {
    const role = event.data;
    this.openmct.user.setActiveRole(role);
  }
  broadcastNewRole(role) {
    if (!this.#roleChannel.name) {
      return false;
    }

    this.#roleChannel.postMessage(role);
  }
  destroy() {
    this.unsubscribeFromRoleChanges(this.setActiveRoleFromChannelMessage);
    this.#roleChannel.close();
  }
}

export default ActiveRoleSynchronizer;
