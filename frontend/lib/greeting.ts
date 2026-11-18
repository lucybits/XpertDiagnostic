/**
 * Saludo según la hora local.
 * @post "Buenos días" de 5:00 a 11:59, "Buenas tardes" de 12:00 a 18:59 y "Buenas noches" el resto.
 */
export function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Buenos días';
  if (hour >= 12 && hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Fecha larga en español, por ejemplo "lunes, 16 de noviembre de 2026". */
export function formatLongDate(date: Date): string {
  const text = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
