class Clipboard {
  updateClipboard(newClip) {
    // return promise
    return navigator.clipboard.writeText(newClip);
  }

  readClipboard() {
    // return promise
    return navigator.clipboard.readText();
  }
}

export default new Clipboard();
