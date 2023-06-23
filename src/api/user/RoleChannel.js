import { BROADCAST_CHANNEL_NAME } from './constants';

class RoleChannel {
  #roleChannel;

  constructor(openmct, channelName = BROADCAST_CHANNEL_NAME) {
    this.openmct = openmct;
    this.channelName = channelName;
  }

  createRoleChannel() {
    this.#roleChannel = new BroadcastChannel(this.channelName);
  }
  subscribeToRole(cb) {
    this.#roleChannel.onmessage = (event) => {
      const role = event.data;
      this.openmct.user.setActiveRole(role);
      if (cb) {
        cb(role);
      }
    };
  }
  unsubscribeToRole() {
    this.#roleChannel.close();
  }
  reconnect() {
    this.#roleChannel.close();
    this.createRoleChannel();
  }

  broadcastNewRole(role) {
    if (!this.#roleChannel.name) {
      return false;
    }

    try {
      this.#roleChannel.postMessage(role);
    } catch (e) {
      console.error(e);
      this.reconnect();
      this.broadcastNewRole(role);
      /** FIXME: there doesn't seem to be a reliable way to test for open/closed
       * status of a broadcast channel; channel.name exists even after the
       * channel is closed. Failure to update the subscribed tabs, should
       * not block the focused tab's selection and so it is caught here.
       * An error will often be thrown if the dialog remains open during HMR.
       **/
    }
  }
}

export default RoleChannel;
