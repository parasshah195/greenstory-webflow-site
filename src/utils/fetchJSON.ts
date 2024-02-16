export async function fetchJSON(url: string) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (e) {
    console.error('Error doing fetch query to URL', url, e);
  }
}
