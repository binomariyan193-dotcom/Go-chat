export const formatTime = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDateHeader = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};
