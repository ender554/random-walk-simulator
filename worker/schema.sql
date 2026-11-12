-- Tool-to-tool clicks, one row per click (worker/index.js). No IP address, user agent or cookie.
-- Applied once with: npx wrangler d1 execute chancescope-hops --remote --file worker/schema.sql
CREATE TABLE IF NOT EXISTS hops (
  id INTEGER PRIMARY KEY,
  day TEXT NOT NULL,       -- UTC date, YYYY-MM-DD
  from_tool TEXT NOT NULL, -- slug of the page the click was on
  to_tool TEXT NOT NULL,   -- slug of the tool it opened
  via TEXT NOT NULL        -- which link: next-1..3, surprised, related, text, other
);

-- Read the counts in the dashboard (D1 > chancescope-hops > Console):
-- SELECT from_tool, to_tool, via, COUNT(*) AS clicks FROM hops GROUP BY 1, 2, 3 ORDER BY clicks DESC;
