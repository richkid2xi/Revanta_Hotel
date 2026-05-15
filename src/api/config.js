let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Ensure the URL has a protocol, otherwise Axios treats it as a relative path
if (API_URL && !API_URL.startsWith('http')) {
  API_URL = `https://${API_URL}`;
}

export default API_URL;
