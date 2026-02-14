const script = document.createElement("script");
script.src = chrome.runtime.getURL("inject.js");
script.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Forward messages from inject.js to background.js
window.addEventListener("SECURITY_SIGNAL", (event) => {
  chrome.runtime.sendMessage({
    type: "THREAT_DETECTED",
    details: event.detail
  });
});
