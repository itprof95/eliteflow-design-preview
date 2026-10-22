// Preserve old section bookmarks while forwarding to the merged pages.
(() => {
  const destination = new URL(document.documentElement.dataset.redirectTarget, location.href);
  if (location.hash) destination.hash = location.hash;
  location.replace(destination.href);
})();
