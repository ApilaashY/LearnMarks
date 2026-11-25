(() => {
  const url = new URL(location.href);
  if (
    url.pathname !== "/d2l/lms/grades/my_grades/main.d2l" ||
    !url.searchParams.has("ou")
  ) {
    return;
  }

  const fraction = /(?<![\d.])[-+]?\d+(?:\.\d+)?(\s*\/\s*)(\d+(?:\.\d+)?)(?![\d.])/g;

  function updateText(node) {
    const parent = node.parentElement;
    if (
      !parent ||
      parent.isContentEditable ||
      parent.closest("script, style, noscript, textarea")
    ) {
      return;
    }

    const updated = node.data.replace(fraction, (_, separator, denominator) =>
      `${denominator}${separator}${denominator}`
    );
    if (updated !== node.data) {
      node.data = updated;
    }
  }

  function updateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      updateText(node);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_NODE) {
      return;
    }
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      updateText(walker.currentNode);
    }
  }

  updateNode(document);

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        updateText(mutation.target);
      } else {
        for (const node of mutation.addedNodes) {
          updateNode(node);
        }
      }
    }
  }).observe(document, { subtree: true, childList: true, characterData: true });
})();
