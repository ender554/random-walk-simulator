import seedrandom from 'seedrandom';
import { logCheckpoints } from './stats';

// With d doors the host opens every other goat door but one; switching wins unless the first pick was the car.
export const switchWinChance = (doors) => (doors - 1) / doors;

export function simulateGames({ games, doors, seed }) {
  const rng = seedrandom(seed ?? '');
  const pick = () => Math.floor(rng() * doors);
  let stayWins = 0;
  let switchWins = 0;
  const running = [];
  const checkpoints = logCheckpoints(games);
  let next = 0;

  for (let g = 1; g <= games; g += 1) {
    const car = pick();
    const choice = pick();
    // Host leaves closed: the car if the player missed it, otherwise a random goat door.
    let other = car;
    if (choice === car) {
      other = Math.floor(rng() * (doors - 1));
      if (other >= car) other += 1;
    }
    if (choice === car) stayWins += 1;
    if (other === car) switchWins += 1;
    if (g === checkpoints[next]) {
      running.push([g, stayWins / g, switchWins / g]);
      next += 1;
    }
  }

  return { stayWins, switchWins, running };
}
