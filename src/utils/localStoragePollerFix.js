if (typeof window !== "undefined") {
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    const event = new CustomEvent("onLocalStorageChange", {
      detail: { key, value },
    });
    window.dispatchEvent(event);
    originalSetItem.apply(this, arguments);
  };

  const originalRemoveItem = localStorage.removeItem;
  localStorage.removeItem = function (key) {
    const event = new CustomEvent("onLocalStorageChange", {
      detail: { key, value: null },
    });
    window.dispatchEvent(event);
    originalRemoveItem.apply(this, arguments);
  };

  const originalClear = localStorage.clear;
  localStorage.clear = function () {
    const event = new CustomEvent("onLocalStorageChange", {
      detail: { key: null, value: null, clear: true },
    });
    window.dispatchEvent(event);
    originalClear.apply(this, arguments);
  };
}
