// Intercepts eval() calls to detect suspicious dynamic code execution.
// Injected into the page context via web_accessible_resources.
(function () {
  "use strict";

  // Save the original eval reference BEFORE overriding
  const originalEval = window.eval;

  window.eval = function (code) {
    // Dispatch a security signal for the content script to pick up
    try {
      window.dispatchEvent(
        new CustomEvent("SECURITY_SIGNAL", {
          detail: {
            reason: "possibly dangerous JS call detected",
            codeSnippet: typeof code === "string" ? code.substring(0, 100) : ""
          }
        })
      );
    } catch (e) {
      // Silently fail if event dispatch errors - don't break the page
    }

    // Call the original eval so page functionality is preserved
    return originalEval.apply(this, arguments);
  };

  console.log("[Net Guard] Window monitoring active.");
})();
