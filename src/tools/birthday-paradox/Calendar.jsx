import { MONTHS, dayLabel } from '../../utils/birthdays';

// A year as a grid of days, with each birthday in the group marked; shared days stand out.
function Calendar({ days, emptyText = 'Nobody in this group shares a birthday.' }) {
  const counts = new Map();
  for (const day of days) counts.set(day, (counts.get(day) ?? 0) + 1);
  const shared = [...counts].filter(([, c]) => c > 1).sort((a, b) => a[0] - b[0]);

  return (
    <>
      <div className="calendar" aria-hidden="true">
        {MONTHS.map(([name, length], m) => {
          const monthStart = MONTHS.slice(0, m).reduce((sum, [, len]) => sum + len, 0);
          const cells = [];
          for (let d = 0; d < 31; d += 1) {
            if (d >= length) {
              // Feb 29 sits in Feb's 29th cell when someone has it
              const leap = m === 1 && d === 28 ? counts.get(365) ?? 0 : 0;
              cells.push(
                <span key={d} className={`day${leap > 1 ? ' shared' : leap === 1 ? ' taken' : ' blank'}`} title={leap ? 'Feb 29' : undefined} />,
              );
              continue;
            }
            const c = counts.get(monthStart + d) ?? 0;
            cells.push(<span key={d} className={`day${c > 1 ? ' shared' : c === 1 ? ' taken' : ''}`} title={`${name} ${d + 1}`} />);
          }
          return (
            <div key={name} className="month">
              <span className="month-name">{name}</span>
              {cells}
            </div>
          );
        })}
      </div>
      <p className="chart-caption">
        {shared.length
          ? `Shared birthdays: ${shared.map(([day, c]) => `${dayLabel(day)} (${c} people)`).join(', ')}.`
          : emptyText}
      </p>
    </>
  );
}

export default Calendar;
