export async function fetchSignalModuleData(endpoint, options = {}) {
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`Signal API request failed: ${response.status}`);
  }

  return response.json();
}
