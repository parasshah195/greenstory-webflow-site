export function getProjectIDFromURL() {
  const pageURL = new URL(window.location.href);
  return pageURL.pathname.split('/').pop();
}
