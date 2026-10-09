/**
 * Sample real-world Cricsheet T20 match format (India vs Pakistan / SPL format)
 * to test Cricsheet importing instantly.
 */
export const SAMPLE_CRICSHEET_DATA = {
  info: {
    balls_per_over: 6,
    dates: ["2026-03-15"],
    event: { name: "Gully Championship Cup" },
    gender: "male",
    match_type: "T20",
    overs: 4,
    teams: ["Hyderabad Strikers", "Bangalore Blasters"],
  },
  innings: [
    {
      team: "Hyderabad Strikers",
      overs: [
        {
          over: 0,
          deliveries: [
            { batter: "Ravi", bowler: "Kiran", non_striker: "Suresh", runs: { batter: 4, extras: 0, total: 4 } },
            { batter: "Ravi", bowler: "Kiran", non_striker: "Suresh", runs: { batter: 1, extras: 0, total: 1 } },
            { batter: "Suresh", bowler: "Kiran", non_striker: "Ravi", runs: { batter: 0, extras: 0, total: 0 } },
            { batter: "Suresh", bowler: "Kiran", non_striker: "Ravi", runs: { batter: 2, extras: 0, total: 2 } },
            { batter: "Suresh", bowler: "Kiran", non_striker: "Ravi", runs: { batter: 0, extras: 1, total: 1 }, extras: { wides: 1 } },
            { batter: "Suresh", bowler: "Kiran", non_striker: "Ravi", runs: { batter: 6, extras: 0, total: 6 } },
            {
              batter: "Suresh",
              bowler: "Kiran",
              non_striker: "Ravi",
              runs: { batter: 0, extras: 0, total: 0 },
              wickets: [{ kind: "caught", player_out: "Suresh", fielders: [{ name: "Prasad" }] }],
            },
          ],
        },
        {
          over: 1,
          deliveries: [
            { batter: "Ravi", bowler: "Prasad", non_striker: "Anil", runs: { batter: 1, extras: 0, total: 1 } },
            { batter: "Anil", bowler: "Prasad", non_striker: "Ravi", runs: { batter: 4, extras: 0, total: 4 } },
            { batter: "Anil", bowler: "Prasad", non_striker: "Ravi", runs: { batter: 0, extras: 0, total: 0 } },
            { batter: "Anil", bowler: "Prasad", non_striker: "Ravi", runs: { batter: 1, extras: 0, total: 1 } },
            { batter: "Ravi", bowler: "Prasad", non_striker: "Anil", runs: { batter: 6, extras: 0, total: 6 } },
            { batter: "Ravi", bowler: "Prasad", non_striker: "Anil", runs: { batter: 2, extras: 0, total: 2 } },
          ],
        },
      ],
    },
  ],
};
