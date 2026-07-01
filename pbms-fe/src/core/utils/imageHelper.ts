export const getImageUrl = (path: string | undefined | null): string => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  // Handle raw base64 strings that might remain in the database
  if (path.startsWith('/9j/')) {
    return `data:image/jpeg;base64,${path}`;
  }
  if (path.startsWith('iVBORw0KGgo')) {
    return `data:image/png;base64,${path}`;
  }
  if (!path.startsWith('/') && path.length > 200) {
    return `data:image/jpeg;base64,${path}`;
  }

  const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
};
