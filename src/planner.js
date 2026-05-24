const VALID_TAGS = new Set([
  "ADVENTURE",
  "CULTURE",
  "FOOD",
  "NATURE",
  "SHOPPING",
  "NIGHTLIFE",
]);

const TAG_INDEX = {
  ADVENTURE: 0,
  CULTURE: 1,
  FOOD: 2,
  NATURE: 3,
  SHOPPING: 4,
  NIGHTLIFE: 5,
};

function normalizeTrip(input) {
  const days = Number(input.days);
  const hoursPerDay = Number(input.hoursPerDay);
  const travellers = (input.travellers || []).map((traveller) => ({
    name: String(traveller.name),
    dailyBudget: Number(traveller.dailyBudget),
    energy: Number(traveller.energy),
    interests: [...new Set(traveller.interests || [])],
    active: traveller.active !== false,
  }));
  const activities = (input.activities || [])
    .map((activity) => ({
      id: Number(activity.id),
      name: String(activity.name),
      cost: Number(activity.cost),
      duration: Number(activity.duration),
      energy: Number(activity.energy),
      tag: String(activity.tag),
    }))
    .sort((left, right) => left.id - right.id);
  const events = (input.events || []).map(normalizeEvent);

  validateTrip(days, hoursPerDay, travellers, activities, events);
  return { days, hoursPerDay, travellers, activities, events };
}

function normalizeEvent(event) {
  if (typeof event === "string") {
    const parts = event.trim().split(/\s+/);
    const type = parts[0];
    const day = Number(parts[1]);
    if (type === "WEATHER") return { type, day, tag: parts[2], raw: event.trim() };
    if (type === "DROP") return { type, day, traveller: parts[2], raw: event.trim() };
    if (type === "FATIGUE" || type === "BUDGET") {
      return {
        type,
        day,
        traveller: parts[2],
        value: Number(parts[3]),
        raw: event.trim(),
      };
    }
  }

  const type = String(event.type);
  const day = Number(event.day);
  if (type === "WEATHER") {
    const tag = String(event.tag || event.subject);
    return { type, day, tag, raw: event.raw || `WEATHER ${day} ${tag}` };
  }
  if (type === "DROP") {
    const traveller = String(event.traveller || event.subject);
    return { type, day, traveller, raw: event.raw || `DROP ${day} ${traveller}` };
  }
  if (type === "FATIGUE" || type === "BUDGET") {
    const traveller = String(event.traveller || event.subject);
    const value = Number(event.value);
    return { type, day, traveller, value, raw: event.raw || `${type} ${day} ${traveller} ${value}` };
  }

  throw new Error(`Unknown event type: ${type}`);
}

function validateTrip(days, hoursPerDay, travellers, activities, events) {
  if (!Number.isInteger(days) || days <= 0) throw new Error("days must be a positive integer");
  if (!Number.isInteger(hoursPerDay) || hoursPerDay <= 0) {
    throw new Error("hoursPerDay must be a positive integer");
  }
  if (travellers.length === 0) throw new Error("at least one traveller is required");
  if (activities.length === 0) throw new Error("at least one activity is required");

  const ids = new Set();
  for (const traveller of travellers) {
    if (!traveller.name) throw new Error("traveller name is required");
    if (traveller.dailyBudget < 0 || traveller.energy < 0) {
      throw new Error("traveller budget and energy cannot be negative");
    }
    if (traveller.interests.length === 0) throw new Error(`${traveller.name} needs at least one interest`);
    for (const tag of traveller.interests) {
      if (!VALID_TAGS.has(tag)) throw new Error(`invalid interest tag: ${tag}`);
    }
  }

  for (const activity of activities) {
    if (ids.has(activity.id)) throw new Error(`duplicate activity id: ${activity.id}`);
    ids.add(activity.id);
    if (!VALID_TAGS.has(activity.tag)) throw new Error(`invalid activity tag: ${activity.tag}`);
    if (activity.cost <= 0 || activity.duration <= 0 || activity.energy <= 0) {
      throw new Error("activity cost, duration, and energy must be positive");
    }
  }

  for (const event of events) {
    if (event.day < 1 || event.day > days) throw new Error(`event day out of range: ${event.day}`);
  }
}

function buildPlan(input) {
  const trip = normalizeTrip(input);
  const state = createPlannerState(trip);
  const dayPlans = Array.from({ length: trip.days + 1 }, (_, day) => emptyDay(day));

  replanFrom(1, trip, state, dayPlans);
  const initialPlan = dayPlans.slice(1).map(copyDay);

  const eventReports = [];
  trip.events.forEach((event, index) => {
    applyEvent(event, trip, state);
    replanFrom(event.day, trip, state, dayPlans);
    eventReports.push({
      eventIndex: index + 1,
      event,
      replannedDays: dayPlans.slice(event.day).map(copyDay),
    });
  });

  return {
    initialPlan,
    events: eventReports,
    contestOutput: toContestOutput(initialPlan, eventReports),
  };
}

function createPlannerState(trip) {
  const activityCount = trip.activities.length;
  const totalMasks = 1 << activityCount;
  const subsetCost = Array(totalMasks).fill(0);
  const subsetDuration = Array(totalMasks).fill(0);
  const subsetEnergy = Array(totalMasks).fill(0);
  const subsetTags = Array(totalMasks).fill(0);
  const weatherBlocks = Array.from({ length: trip.days + 1 }, () => new Set());

  for (let mask = 1; mask < totalMasks; mask += 1) {
    const bit = mask & -mask;
    const index = bitIndex(bit);
    const previous = mask ^ bit;
    const activity = trip.activities[index];
    subsetCost[mask] = subsetCost[previous] + activity.cost;
    subsetDuration[mask] = subsetDuration[previous] + activity.duration;
    subsetEnergy[mask] = subsetEnergy[previous] + activity.energy;
    subsetTags[mask] = subsetTags[previous] | (1 << TAG_INDEX[activity.tag]);
  }

  return { subsetCost, subsetDuration, subsetEnergy, subsetTags, weatherBlocks };
}

function replanFrom(startDay, trip, state, dayPlans) {
  let usedMask = 0;
  for (let day = 1; day < startDay; day += 1) {
    usedMask |= maskFromIds(dayPlans[day].activityIds, trip.activities);
  }

  for (let day = startDay; day <= trip.days; day += 1) {
    dayPlans[day] = chooseDay(day, usedMask, trip, state);
    usedMask |= maskFromIds(dayPlans[day].activityIds, trip.activities);
  }
}

function chooseDay(day, usedMask, trip, state) {
  const activeTravellers = trip.travellers.filter((traveller) => traveller.active);
  if (activeTravellers.length === 0) {
    return {
      ...emptyDay(day),
      audit: { reason: "No active travellers remain." },
    };
  }

  const minBudget = Math.min(...activeTravellers.map((traveller) => traveller.dailyBudget));
  const minEnergy = Math.min(...activeTravellers.map((traveller) => traveller.energy));
  const interestCounts = buildInterestCounts(activeTravellers);
  const activityScores = trip.activities.map((activity) => interestCounts[activity.tag] || 0);
  const subsetSatisfaction = buildSubsetSatisfaction(activityScores);
  const blockedBits = blockedTagBits(state.weatherBlocks[day]);

  let bestMask = 0;
  let bestSatisfaction = 0;
  let bestCost = 0;
  let feasibleSubsets = 0;

  for (let mask = 0; mask < state.subsetCost.length; mask += 1) {
    if (mask & usedMask) continue;
    if (state.subsetTags[mask] & blockedBits) continue;
    if (state.subsetCost[mask] > minBudget) continue;
    if (state.subsetEnergy[mask] > minEnergy) continue;
    if (state.subsetDuration[mask] > trip.hoursPerDay) continue;

    feasibleSubsets += 1;
    const candidateSatisfaction = subsetSatisfaction[mask];
    const candidateCost = state.subsetCost[mask];

    if (
      isBetter(
        mask,
        candidateSatisfaction,
        candidateCost,
        bestMask,
        bestSatisfaction,
        bestCost,
        trip.activities,
      )
    ) {
      bestMask = mask;
      bestSatisfaction = candidateSatisfaction;
      bestCost = candidateCost;
    }
  }

  const activityIds = idsFromMask(bestMask, trip.activities);
  return {
    day,
    activityIds,
    rest: activityIds.length === 0,
    cost: state.subsetCost[bestMask],
    duration: state.subsetDuration[bestMask],
    energy: state.subsetEnergy[bestMask],
    satisfaction: bestSatisfaction,
    audit: {
      activeTravellers: activeTravellers.map((traveller) => traveller.name),
      minBudget,
      minEnergy,
      hoursPerDay: trip.hoursPerDay,
      weatherBlockedTags: [...state.weatherBlocks[day]].sort(),
      feasibleSubsets,
      decisionKey: [-bestSatisfaction, bestCost, activityIds],
      reason: activityIds.length === 0 ? "Best feasible subset is empty, so the day is REST." : undefined,
    },
  };
}

function buildInterestCounts(travellers) {
  const counts = {};
  travellers.forEach((traveller) => {
    traveller.interests.forEach((tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  return counts;
}

function buildSubsetSatisfaction(activityScores) {
  const totalMasks = 1 << activityScores.length;
  const satisfaction = Array(totalMasks).fill(0);
  for (let mask = 1; mask < totalMasks; mask += 1) {
    const bit = mask & -mask;
    const index = bitIndex(bit);
    satisfaction[mask] = satisfaction[mask ^ bit] + activityScores[index];
  }
  return satisfaction;
}

function isBetter(mask, satisfaction, cost, bestMask, bestSatisfaction, bestCost, activities) {
  if (satisfaction !== bestSatisfaction) return satisfaction > bestSatisfaction;
  if (cost !== bestCost) return cost < bestCost;
  return maskLexLess(mask, bestMask, activities);
}

function maskLexLess(left, right, activities) {
  const leftIds = idsFromMask(left, activities);
  const rightIds = idsFromMask(right, activities);
  const length = Math.min(leftIds.length, rightIds.length);
  for (let index = 0; index < length; index += 1) {
    if (leftIds[index] !== rightIds[index]) return leftIds[index] < rightIds[index];
  }
  return leftIds.length < rightIds.length;
}

function idsFromMask(mask, activities) {
  const ids = [];
  for (let index = 0; index < activities.length; index += 1) {
    if (mask & (1 << index)) ids.push(activities[index].id);
  }
  return ids;
}

function maskFromIds(ids, activities) {
  const wanted = new Set(ids);
  let mask = 0;
  activities.forEach((activity, index) => {
    if (wanted.has(activity.id)) mask |= 1 << index;
  });
  return mask;
}

function blockedTagBits(tags) {
  let bits = 0;
  tags.forEach((tag) => {
    bits |= 1 << TAG_INDEX[tag];
  });
  return bits;
}

function applyEvent(event, trip, state) {
  if (event.type === "WEATHER") {
    state.weatherBlocks[event.day].add(event.tag);
    return;
  }

  const traveller = trip.travellers.find((person) => person.name === event.traveller);
  if (!traveller) throw new Error(`unknown traveller: ${event.traveller}`);

  if (event.type === "DROP") traveller.active = false;
  else if (event.type === "FATIGUE") traveller.energy = event.value;
  else if (event.type === "BUDGET") traveller.dailyBudget = event.value;
  else throw new Error(`unknown event type: ${event.type}`);
}

function emptyDay(day) {
  return {
    day,
    activityIds: [],
    rest: true,
    cost: 0,
    duration: 0,
    energy: 0,
    satisfaction: 0,
    audit: {},
  };
}

function copyDay(day) {
  return {
    ...day,
    activityIds: [...day.activityIds],
    audit: {
      ...day.audit,
      decisionKey: day.audit.decisionKey ? [...day.audit.decisionKey] : undefined,
    },
  };
}

function toContestOutput(initialPlan, eventReports) {
  const lines = ["=== PLAN ==="];
  initialPlan.forEach((day) => lines.push(formatDay(day)));
  eventReports.forEach((eventReport) => {
    lines.push(`=== EVENT ${eventReport.eventIndex}: ${eventReport.event.raw} ===`);
    eventReport.replannedDays.forEach((day) => lines.push(formatDay(day)));
  });
  return `${lines.join("\n")}\n`;
}

function formatDay(day) {
  if (!day.activityIds.length) return `Day ${day.day}: REST | cost=0 satisfaction=0`;
  return `Day ${day.day}: ${day.activityIds.join(" ")} | cost=${day.cost} satisfaction=${day.satisfaction}`;
}

function bitIndex(bit) {
  return Math.log2(bit) | 0;
}

module.exports = {
  buildPlan,
  normalizeTrip,
  normalizeEvent,
  formatDay,
};
