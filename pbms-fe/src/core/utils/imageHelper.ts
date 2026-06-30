export const getImageUrl = (path: string | undefined | null): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';
  return `${baseUrl}${path}`;
};
