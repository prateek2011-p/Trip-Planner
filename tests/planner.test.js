const test = require("node:test");
const assert = require("node:assert/strict");
const { buildPlan } = require("../src/planner");

test("matches the sample itinerary and event replan", () => {
  const report = buildPlan({
    days: 2,
    hoursPerDay: 8,
    travellers: [
      { name: "Alice", dailyBudget: 100, energy: 80, interests: ["ADVENTURE", "FOOD"] },
      { name: "Bob", dailyBudget: 80, energy: 60, interests: ["CULTURE", "FOOD"] },
      { name: "Cara", dailyBudget: 120, energy: 70, interests: ["NATURE", "FOOD"] },
    ],
    activities: [
      { id: 1, name: "Museum", cost: 30, duration: 3, energy: 20, tag: "CULTURE" },
      { id: 2, name: "Hike", cost: 40, duration: 5, energy: 50, tag: "ADVENTURE" },
      { id: 3, name: "Cafe", cost: 20, duration: 2, energy: 10, tag: "FOOD" },
      { id: 4, name: "Park", cost: 25, duration: 3, energy: 15, tag: "NATURE" },
    ],
    events: [{ type: "WEATHER", day: 2, tag: "ADVENTURE" }],
  });

  assert.deepEqual(report.initialPlan[0].activityIds, [1, 3, 4]);
  assert.deepEqual(report.initialPlan[1].activityIds, [2]);
  assert.equal(report.events[0].replannedDays[0].rest, true);
});

test("uses lower cost before lexicographic id list", () => {
  const report = buildPlan({
    days: 1,
    hoursPerDay: 1,
    travellers: [
      { name: "Ann", dailyBudget: 100, energy: 100, interests: ["ADVENTURE"] },
      { name: "Ben", dailyBudget: 100, energy: 100, interests: ["ADVENTURE"] },
      { name: "Cal", dailyBudget: 100, energy: 100, interests: ["FOOD"] },
    ],
    activities: [
      { id: 1, name: "Zipline", cost: 20, duration: 1, energy: 1, tag: "ADVENTURE" },
      { id: 2, name: "Climb", cost: 10, duration: 1, energy: 1, tag: "ADVENTURE" },
    ],
  });

  assert.deepEqual(report.initialPlan[0].activityIds, [2]);
});

test("chooses REST when every valuable option is blocked or unavailable", () => {
  const report = buildPlan({
    days: 1,
    hoursPerDay: 5,
    travellers: [
      { name: "Ann", dailyBudget: 100, energy: 100, interests: ["FOOD"] },
      { name: "Ben", dailyBudget: 100, energy: 100, interests: ["FOOD"] },
      { name: "Cal", dailyBudget: 100, energy: 100, interests: ["FOOD"] },
    ],
    activities: [{ id: 1, name: "Mall", cost: 10, duration: 1, energy: 1, tag: "SHOPPING" }],
  });

  assert.equal(report.initialPlan[0].rest, true);
});
