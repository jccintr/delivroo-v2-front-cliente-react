export const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const hhmm = (t) => String(t).slice(0, 5);

/** [{weekday, opensAt, closesAt}] -> [{weekday, label, windows:["18:00 às 23:30"]}] de segunda a domingo */
export function groupHours(businessHours = []) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((weekday) => {
    const windows = businessHours
      .filter((h) => h.weekday === weekday)
      .sort((a, b) => String(a.opensAt).localeCompare(String(b.opensAt)))
      .map((h) => `${hhmm(h.opensAt)} às ${hhmm(h.closesAt)}`);
    return { weekday, label: WEEKDAYS[weekday], windows };
  });
}

/** "Abre hoje às 18:00" / "Abre amanhã às 18:00" / "Abre terça às 18:00" — null se não houver horários */
export function nextOpeningText(businessHours = [], now = new Date()) {
  if (!businessHours.length) return null;
  const minutes = now.getHours() * 60 + now.getMinutes();
  for (let add = 0; add < 8; add += 1) {
    const day = (now.getDay() + add) % 7;
    const starts = businessHours
      .filter((h) => h.weekday === day)
      .map((h) => ({ at: hhmm(h.opensAt), min: Number(String(h.opensAt).slice(0, 2)) * 60 + Number(String(h.opensAt).slice(3, 5)) }))
      .filter((s) => add > 0 || s.min > minutes)
      .sort((a, b) => a.min - b.min);
    if (starts.length) {
      const when = add === 0 ? 'hoje' : add === 1 ? 'amanhã' : WEEKDAYS[day].replace('-feira', '').toLowerCase();
      return `Abre ${when} às ${starts[0].at}`;
    }
  }
  return null;
}
