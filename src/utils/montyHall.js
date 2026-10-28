import seedrandom from 'seedrandom';
import { logCheckpoints } from './stats';

export const HOST_RULES = {
  knows: {
    label: 'Host knows (classic)',
    short: 'knows where the car is and always opens goat doors',
  },
  random: {
    label: "Host doesn't know (Monty Fall)",
    short: 'opens doors at random; games where he reveals the car are thrown out',
  },
  lazy: {
    label: 'Lazy host (Monty Crawl)',
    short: 'knows where the car is, but always opens the lowest-numbered goat doors he can',
  },
};

// Which other door the host leaves closed, given the car, the player's pick and the host rule.
// Returns { other, voided }. With d doors the host always opens d - 2 doors.
export function hostLeavesClosed(rule, doors, car, pick, rng) {
  if (rule === 'random') {
    // Leave one random non-picked door closed and open the rest; it may expose the car.
    let other = Math.floor(rng() * (doors - 1));
    if (other >= pick) other += 1;
    return { other, voided: car !== pick && car !== other };
  }
  if (car !== pick) return { other: car, voided: false };
  if (rule === 'lazy') {
    // Opens the lowest-numbered doors, so the highest-numbered other door stays closed
    return { other: pick === doors - 1 ? doors - 2 : doors - 1, voided: false };
  }
  let other = Math.floor(rng() * (doors - 1));
  if (other >= pick) other += 1;
  return { other, voided: false };
}

export function theory(rule, doors) {
  if (rule === 'random') return { stay: 0.5, switch: 0.5, voided: (doors - 2) / doors };
  return { stay: 1 / doors, switch: (doors - 1) / doors, voided: 0 };
}

export function simulateGames({ games, doors, rule, seed }) {
  const rng = seedrandom(seed ?? '');
  const car = new Uint8Array(games);
  const pick = new Uint8Array(games);
  const other = new Uint8Array(games);
  const voided = new Uint8Array(games);
  const checkpoints = logCheckpoints(games);
  const running = [];
  let next = 0;
  let counted = 0;
  let stayWins = 0;
  let switchWins = 0;
  let pickedCar = 0;
  // Lazy host: "passed over" means he skipped a lower door he could have opened
  let passedOver = 0;
  let passedOverSwitchWins = 0;

  for (let g = 0; g < games; g += 1) {
    car[g] = Math.floor(rng() * doors);
    pick[g] = Math.floor(rng() * doors);
    const result = hostLeavesClosed(rule, doors, car[g], pick[g], rng);
    other[g] = result.other;
    voided[g] = result.voided ? 1 : 0;

    if (!result.voided) {
      counted += 1;
      if (pick[g] === car[g]) {
        stayWins += 1;
        pickedCar += 1;
      }
      if (result.other === car[g]) switchWins += 1;
      if (rule === 'lazy') {
        const lowestOther = pick[g] === 0 ? 1 : 0;
        if (result.other === lowestOther && doors === 3) {
          passedOver += 1;
          if (result.other === car[g]) passedOverSwitchWins += 1;
        }
      }
    }

    if (g + 1 === checkpoints[next]) {
      if (counted) running.push([g + 1, stayWins / counted, switchWins / counted]);
      next += 1;
    }
  }

  return {
    car, pick, other, voided, running, counted, stayWins, switchWins,
    pickedCar, pickedGoat: counted - pickedCar, voidedCount: games - counted,
    passedOver, passedOverSwitchWins,
  };
}

export const switchWinChance = (doors) => (doors - 1) / doors;
