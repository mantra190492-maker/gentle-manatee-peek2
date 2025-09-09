export function exportToCsv(filename: string, data: any[]): void {
  if (!data || data.length === 0) {
    alert("No data to export.");
    return;
  }

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName])).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) { // feature detection
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}