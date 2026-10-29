# Birthday Paradox: feature research (2026-10-28)

**How to be the best:** the only birthday tool that answers every version of the question with the exact answer next to a simulation, and lets a class enter its own birthdays. The versions are:
- any two people share a birthday
- someone shares my birthday
- three or more people share one
- two birthdays within k days
- real birth data instead of equal odds for every day
- any number of "days" (for example hash values)

Competitors:
- Omni: custom number of days, leap year.
- dCode: at least / exactly N people sharing, a specific date, CSV.
- 1728 and SAS: three people (88 for 50%), four people (187).
- Redcrab: probability table.
- perthirtysix: pair lines; simulate until a match.
- BetterExplained: an adjustable number of items.
- The Pudding: guess first.
- Nobody offers near-birthdays or real birth data. Free real data exists (SSA 2000–2014).

Evidence:
- Wikipedia talk page: "There are no examples here of real life tests"; leap years are ignored.
- People keep confusing "someone shares my birthday" with "any two match": about 6% vs. 50.7% at 23 people; 253 people are needed for 50% on a specific date.

Must:
- My-birthday mode.
- Custom number of days N, with presets including hash bits.
- A reverse calculator.
- Enter your class's birthdays.
- A share link.

Should:
- k = 3 or 4 people sharing.
- A near-birthday window.
- Real US birth data.
- An animated room with pair lines.
- Guess first.

Could:
- CSV table.
- A coupon-collector simulation.
