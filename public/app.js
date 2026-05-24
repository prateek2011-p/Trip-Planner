const TAGS = ["ADVENTURE", "CULTURE", "FOOD", "NATURE", "SHOPPING", "NIGHTLIFE"];
const EVENT_TYPES = ["WEATHER", "DROP", "FATIGUE", "BUDGET"];

const form = document.querySelector("#tripForm");
const daysInput = document.querySelector("#daysInput");
const hoursInput = document.querySelector("#hoursInput");
const travellersList = document.querySelector("#travellersList");
const activitiesList = document.querySelector("#activitiesList");
const eventsList = document.querySelector("#eventsList");
const travellerNames = document.querySelector("#travellerNames");
const sampleButton = document.querySelector("#sampleButton");
const addTravellerButton = document.querySelector("#addTravellerButton");
const addActivityButton = document.querySelector("#addActivityButton");
const addEventButton = document.querySelector("#addEventButton");
const statusBadge = document.querySelector("#statusBadge");
const inputOverview = document.querySelector("#inputOverview");
const resultOverview = document.querySelector("#resultOverview");
const planSummary = document.querySelector("#planSummary");

let currentInput = {
  days: 2,
  hoursPerDay: 8,
  travellers: [],
  activities: [],
  events: [],
};

sampleButton.addEventListener("click", loadSample);
addTravellerButton.addEventListener("click", () => {
  syncInputFromForm(false);
  currentInput.travellers.push({
    name: `Traveller${currentInput.travellers.length + 1}`,
    dailyBudget: 100,
    energy: 80,
    interests: ["FOOD"],
  });
  renderInputs();
});

addActivityButton.addEventListener("click", () => {
  syncInputFromForm(false);
  const nextId = Math.max(0, ...currentInput.activities.map((activity) => Number(activity.id))) + 1;
  currentInput.activities.push({
    id: nextId,
    name: `Activity ${nextId}`,
    cost: 20,
    duration: 2,
    energy: 10,
    tag: "FOOD",
  });
  renderInputs();
});

addEventButton.addEventListener("click", () => {
  syncInputFromForm(false);
  currentInput.events.push({
    type: "WEATHER",
    day: 1,
    tag: "ADVENTURE",
  });
  renderInputs();
});

travellersList.addEventListener("click", (event) => removeRow(event, "traveller"));
travellersList.addEventListener("input", (event) => {
  const row = event.target.closest(".traveller-row");
  if (!row) return;
  updateTravellerCardPreview(row);
  updateTravellerNamesDatalist();
});
activitiesList.addEventListener("click", (event) => removeRow(event, "activity"));
eventsList.addEventListener("click", (event) => removeRow(event, "event"));
eventsList.addEventListener("change", (event) => {
  if (!event.target.classList.contains("event-type")) return;
  syncInputFromForm(false);
  renderEvents();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await generatePlan();
});
form.addEventListener("input", () => {
  try {
    renderInputOverview(syncInputFromForm(false));
  } catch {
    return;
  }
});

loadSample();

async function loadSample() {
  setStatus("Loading sample");
  try {
    const response = await fetch("/api/sample");
    if (!response.ok) throw new Error("Unable to load sample trip");
    currentInput = await response.json();
    renderInputs();
    await generatePlan();
  } catch (error) {
    showError(error);
  }
}

async function generatePlan() {
  setStatus("Planning");
  try {
    const payload = syncInputFromForm(true);

    const response = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const report = await response.json();
    if (!response.ok) throw new Error(report.error || "Unable to generate plan");

    currentInput = payload;
    renderReport(report, payload);
    setStatus("Ready");
  } catch (error) {
    showError(error);
  }
}

function syncInputFromForm(shouldValidate) {
  const payload = {
    days: Number(daysInput.value),
    hoursPerDay: Number(hoursInput.value),
    travellers: collectTravellers(),
    activities: collectActivities(),
    events: collectEvents(),
  };

  if (shouldValidate) validateFormPayload(payload);
  currentInput = payload;
  return payload;
}

function validateFormPayload(payload) {
  if (!payload.travellers.length) throw new Error("Add at least one traveller.");
  if (!payload.activities.length) throw new Error("Add at least one activity.");

  payload.travellers.forEach((traveller, index) => {
    if (!traveller.name.trim()) throw new Error(`Traveller ${index + 1} needs a name.`);
    if (!traveller.interests.length) throw new Error(`${traveller.name} needs at least one interest.`);
  });

  payload.activities.forEach((activity, index) => {
    if (!activity.name.trim()) throw new Error(`Activity ${index + 1} needs a name.`);
  });
}

function collectTravellers() {
  return [...travellersList.querySelectorAll(".traveller-row")].map((row) => ({
    name: row.querySelector(".traveller-name").value.trim(),
    dailyBudget: Number(row.querySelector(".traveller-budget").value),
    energy: Number(row.querySelector(".traveller-energy").value),
    interests: [...row.querySelectorAll(".interest-check:checked")].map((input) => input.value),
  }));
}

function collectActivities() {
  return [...activitiesList.querySelectorAll(".activity-row")].map((row) => ({
    id: Number(row.querySelector(".activity-id").value),
    name: row.querySelector(".activity-name").value.trim(),
    cost: Number(row.querySelector(".activity-cost").value),
    duration: Number(row.querySelector(".activity-duration").value),
    energy: Number(row.querySelector(".activity-energy").value),
    tag: row.querySelector(".activity-tag").value,
  }));
}

function collectEvents() {
  return [...eventsList.querySelectorAll(".event-row")].map((row) => {
    const type = row.querySelector(".event-type").value;
    const day = Number(row.querySelector(".event-day").value);

    if (type === "WEATHER") {
      return {
        type,
        day,
        tag: row.querySelector(".event-tag").value,
      };
    }

    const event = {
      type,
      day,
      traveller: row.querySelector(".event-traveller").value.trim(),
    };

    if (type === "FATIGUE" || type === "BUDGET") {
      event.value = Number(row.querySelector(".event-value").value);
    }

    return event;
  });
}

function renderInputs() {
  daysInput.value = currentInput.days;
  hoursInput.value = currentInput.hoursPerDay;
  renderTravellers();
  renderActivities();
  renderEvents();
  renderInputOverview(currentInput);
}

function renderTravellers() {
  travellersList.innerHTML = currentInput.travellers
    .map(
      (traveller, index) => `
        <article class="item-card traveller-row" data-index="${index}">
          <div class="item-title">
            <div class="title-cluster">
              <span class="avatar traveller-avatar">${escapeHtml(initials(traveller.name))}</span>
              <div>
                <h3 class="traveller-heading-name">${escapeHtml(traveller.name || `Traveller ${index + 1}`)}</h3>
                <p class="traveller-heading-meta">${money(traveller.dailyBudget)} budget, ${traveller.energy} energy</p>
              </div>
            </div>
            <button class="danger-button" type="button" data-remove="traveller" data-index="${index}">Remove</button>
          </div>
          <div class="form-grid">
            <label>
              Name
              <input class="traveller-name" type="text" value="${escapeHtml(traveller.name)}" />
            </label>
            <label>
              Daily budget
              <input class="traveller-budget" type="number" min="0" value="${traveller.dailyBudget}" />
            </label>
            <label>
              Energy
              <input class="traveller-energy" type="number" min="0" max="100" value="${traveller.energy}" />
            </label>
            <fieldset class="tag-field">
              <legend>Interests</legend>
              <div class="tag-grid">
                ${TAGS.map((tag) => tagCheckbox(tag, traveller.interests || [])).join("")}
              </div>
            </fieldset>
          </div>
        </article>
      `,
    )
    .join("");

  updateTravellerNamesDatalist();
}

function renderActivities() {
  activitiesList.innerHTML = currentInput.activities
    .map(
      (activity, index) => `
        <article class="item-card activity-row" data-index="${index}">
          <div class="item-title">
            <div class="title-cluster">
              <span class="activity-number">${activity.id}</span>
              <div>
                <h3>${escapeHtml(activity.name || `Activity ${index + 1}`)}</h3>
                <p>${money(activity.cost)} per person, ${activity.duration}h, ${activity.energy} energy</p>
              </div>
            </div>
            <span class="tag-pill tag-${activity.tag.toLowerCase()}">${formatTag(activity.tag)}</span>
            <button class="danger-button" type="button" data-remove="activity" data-index="${index}">Remove</button>
          </div>
          <div class="form-grid">
            <label>
              ID
              <input class="activity-id" type="number" min="1" value="${activity.id}" />
            </label>
            <label>
              Name
              <input class="activity-name" type="text" value="${escapeHtml(activity.name)}" />
            </label>
            <label>
              Tag
              <select class="activity-tag">
                ${tagOptions(activity.tag)}
              </select>
            </label>
            <label>
              Cost
              <input class="activity-cost" type="number" min="1" value="${activity.cost}" />
            </label>
            <label>
              Duration
              <input class="activity-duration" type="number" min="1" value="${activity.duration}" />
            </label>
            <label>
              Energy
              <input class="activity-energy" type="number" min="1" value="${activity.energy}" />
            </label>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderEvents() {
  if (!currentInput.events.length) {
    eventsList.innerHTML = `<div class="empty-state">No trip changes added.</div>`;
    return;
  }

  eventsList.innerHTML = currentInput.events
    .map((event, index) => eventRow(event, index))
    .join("");
}

function eventRow(event, index) {
  const type = event.type || "WEATHER";
  const isWeather = type === "WEATHER";
  const needsValue = type === "FATIGUE" || type === "BUDGET";
  const subjectLabel = isWeather ? "Blocked tag" : "Traveller";
  const valueLabel = type === "FATIGUE" ? "New energy" : "New budget";

  return `
    <article class="item-card event-row" data-index="${index}">
      <div class="item-title">
        <div class="title-cluster">
          <span class="event-marker">${index + 1}</span>
          <div>
            <h3>${eventLabel(type)}</h3>
            <p>${describeDraftEvent(event)}</p>
          </div>
        </div>
        <button class="danger-button" type="button" data-remove="event" data-index="${index}">Remove</button>
      </div>
      <div class="form-grid">
        <label>
          Type
          <select class="event-type">
            ${EVENT_TYPES.map(
              (eventType) => `<option value="${eventType}" ${eventType === type ? "selected" : ""}>${eventLabel(eventType)}</option>`,
            ).join("")}
          </select>
        </label>
        <label>
          Day
          <input class="event-day" type="number" min="1" max="${currentInput.days}" value="${event.day || 1}" />
        </label>
        <label class="${isWeather ? "" : "hidden"}">
          ${subjectLabel}
          <select class="event-tag">
            ${tagOptions(event.tag || "ADVENTURE")}
          </select>
        </label>
        <label class="${isWeather ? "hidden" : ""}">
          ${subjectLabel}
          <input class="event-traveller" type="text" list="travellerNames" value="${escapeHtml(event.traveller || "")}" />
        </label>
        <label class="${needsValue ? "" : "hidden"}">
          ${valueLabel}
          <input class="event-value" type="number" min="0" value="${event.value ?? 50}" />
        </label>
      </div>
    </article>
  `;
}

function removeRow(event, type) {
  const button = event.target.closest(`[data-remove="${type}"]`);
  if (!button) return;
  syncInputFromForm(false);
  const index = Number(button.dataset.index);
  if (type === "traveller") currentInput.travellers.splice(index, 1);
  if (type === "activity") currentInput.activities.splice(index, 1);
  if (type === "event") currentInput.events.splice(index, 1);
  renderInputs();
}

function renderReport(report, payload) {
  const activityMap = new Map(payload.activities.map((activity) => [Number(activity.id), activity]));
  planSummary.innerHTML = "";
  renderResultOverview(report, payload);

  const currentPlan = report.initialPlan.map(copyPlanDay);
  const travellerState = payload.travellers.map((traveller) => ({
    ...traveller,
    interests: [...(traveller.interests || [])],
    active: true,
  }));

  planSummary.appendChild(planSection("Initial plan", report.initialPlan, payload, activityMap));

  report.events.forEach((eventReport) => {
    const previousRemainingPlan = currentPlan.slice(eventReport.event.day - 1);
    const beforeLimits = groupLimits(travellerState);
    applyEventToTravellerState(eventReport.event, travellerState);
    const afterLimits = groupLimits(travellerState);
    const planChanged = !samePlan(previousRemainingPlan, eventReport.replannedDays);

    planSummary.appendChild(
      eventOutcomeSection(eventReport, beforeLimits, afterLimits, planChanged),
    );

    eventReport.replannedDays.forEach((day, index) => {
      currentPlan[eventReport.event.day - 1 + index] = copyPlanDay(day);
    });

    if (!planChanged) return;

    const sectionTitle = `After event ${eventReport.eventIndex}: ${describeEvent(eventReport.event)}`;
    planSummary.appendChild(planSection(sectionTitle, eventReport.replannedDays, payload, activityMap));
  });
}

function eventOutcomeSection(eventReport, beforeLimits, afterLimits, planChanged) {
  const section = document.createElement("section");
  section.className = `event-outcome ${planChanged ? "event-changed" : "event-same"}`;

  const eventText = describeEvent(eventReport.event);
  const limitText = eventLimitMessage(eventReport.event, beforeLimits, afterLimits);
  const decisionText = planChanged
    ? "This event changes the remaining plan. Follow the updated itinerary below to get the maximum possible satisfaction score under the new conditions."
    : "Even though this event occurred, the existing itinerary remains the same. The event does not affect the selected activities or the group limits enough to change the best plan, so you can still follow the same activities.";

  section.innerHTML = `
    <div class="event-outcome-header">
      <span class="event-marker">${eventReport.eventIndex}</span>
      <div>
        <span class="step-label">Event update</span>
        <h3>${escapeHtml(eventText)}</h3>
      </div>
      <span class="event-status ${planChanged ? "status-changed" : "status-same"}">
        ${planChanged ? "Itinerary updated" : "No itinerary change"}
      </span>
    </div>
    <p>${escapeHtml(limitText)}</p>
    <p>${escapeHtml(decisionText)}</p>
  `;

  return section;
}

function planSection(title, days, payload, activityMap) {
  const section = document.createElement("section");
  section.className = "report-section";

  const heading = document.createElement("div");
  heading.className = "report-heading";
  heading.innerHTML = `<h3>${escapeHtml(title)}</h3><span>${days.length} day${days.length === 1 ? "" : "s"}</span>`;

  const dayGrid = document.createElement("div");
  dayGrid.className = "plan-days";
  days.forEach((day) => dayGrid.appendChild(dayCard(day, payload, activityMap)));

  section.append(heading, dayGrid);
  return section;
}

function dayCard(day, payload, activityMap) {
  const card = document.createElement("article");
  card.className = `day-card${day.rest ? " rest-card" : ""}`;

  const activityDetails = day.activityIds
    .map((id) => activityMap.get(Number(id)))
    .filter(Boolean);

  card.innerHTML = `
    <div class="day-card-header">
      <h4>Day ${day.day}</h4>
      <span class="day-badge">${day.rest ? "Rest day" : `${activityDetails.length} activities`}</span>
    </div>
    ${activityDetails.length ? activityList(activityDetails, payload, day) : restMessage(day)}
    <div class="metrics">
      ${metricHtml("Cost/person", money(day.cost))}
      ${metricHtml("Time", `${day.duration}h`)}
      ${metricHtml("Energy", day.energy)}
      ${metricHtml("Satisfaction", day.satisfaction)}
    </div>
    <div class="explanation">
      ${explanationText(day)}
    </div>
  `;

  return card;
}

function activityList(activities, payload, day) {
  return `
    <ul class="activity-list">
      ${activities
        .map((activity) => {
          const fans = likedBy(activity, payload, day.audit.activeTravellers || []);
          return `
            <li>
              <div>
                <strong>${escapeHtml(activity.name)}</strong>
                <span class="tag-pill tag-${activity.tag.toLowerCase()}">${formatTag(activity.tag)}</span>
              </div>
              <small>${money(activity.cost)} per person, ${activity.duration}h, ${activity.energy} energy. Liked by ${fans}.</small>
            </li>
          `;
        })
        .join("")}
    </ul>
  `;
}

function restMessage(day) {
  const blocked = day.audit.weatherBlockedTags?.length
    ? ` Weather blocked: ${day.audit.weatherBlockedTags.map(formatTag).join(", ")}.`
    : "";
  return `<p class="rest-message">No activity set was worth scheduling for this day.${blocked}</p>`;
}

function explanationText(day) {
  const audit = day.audit || {};
  const people = (audit.activeTravellers || []).join(", ") || "no active travellers";
  const blocked = audit.weatherBlockedTags?.length
    ? ` Weather blocked ${audit.weatherBlockedTags.map(formatTag).join(", ")} activities.`
    : "";

  if (day.rest) {
    return `The planner checked ${audit.feasibleSubsets || 0} feasible choices for ${people}. The best valid choice was to rest because no available activity improved the group score.${blocked}`;
  }

  return `Chosen for ${people}. It gives ${day.satisfaction} satisfaction points while staying within the strictest limits: ${money(audit.minBudget)} budget, ${audit.minEnergy} energy, and ${audit.hoursPerDay} hours. The planner compared ${audit.feasibleSubsets} feasible choices, then used lower cost and activity ID order to break ties.${blocked}`;
}

function likedBy(activity, payload, activeNames) {
  const activeSet = new Set(activeNames);
  const names = payload.travellers
    .filter((traveller) => activeSet.has(traveller.name) && traveller.interests.includes(activity.tag))
    .map((traveller) => traveller.name);
  return names.length ? names.join(", ") : "none of the active travellers";
}

function metricHtml(label, value) {
  return `
    <div class="metric">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderInputOverview(payload) {
  const minBudget = payload.travellers.length
    ? Math.min(...payload.travellers.map((traveller) => Number(traveller.dailyBudget || 0)))
    : 0;
  const minEnergy = payload.travellers.length
    ? Math.min(...payload.travellers.map((traveller) => Number(traveller.energy || 0)))
    : 0;

  inputOverview.innerHTML = `
    ${overviewCard("Travellers", payload.travellers.length)}
    ${overviewCard("Activities", payload.activities.length)}
    ${overviewCard("Events", payload.events.length)}
    ${overviewCard("Group limit", `${money(minBudget)} / ${minEnergy}`)}
  `;
}

function renderResultOverview(report, payload) {
  const initialDays = report.initialPlan || [];
  const plannedDays = initialDays.filter((day) => !day.rest).length;
  const totalCost = initialDays.reduce((sum, day) => sum + day.cost, 0);
  const totalScore = initialDays.reduce((sum, day) => sum + day.satisfaction, 0);
  const restDays = initialDays.length - plannedDays;
  const minBudget = payload.travellers.length
    ? Math.min(...payload.travellers.map((traveller) => Number(traveller.dailyBudget || 0)))
    : 0;
  const minEnergy = payload.travellers.length
    ? Math.min(...payload.travellers.map((traveller) => Number(traveller.energy || 0)))
    : 0;

  resultOverview.innerHTML = `
    <div class="summary-grid">
      ${summaryTile("Days planned", `${plannedDays}/${payload.days}`, "blue")}
      ${summaryTile("Total score", totalScore, "green")}
      ${summaryTile("Trip cost/person", money(totalCost), "yellow")}
      ${summaryTile("Rest days", restDays, "rose")}
    </div>
    <section class="traveller-budget-panel">
      <div class="budget-panel-heading">
        <div>
          <span class="step-label">Planning group</span>
          <h3>Travellers and Limits</h3>
        </div>
        <span class="limit-chip">Daily limit: ${money(minBudget)} / ${minEnergy} energy</span>
      </div>
      <div class="traveller-budget-list">
        ${payload.travellers
          .map((traveller) => travellerBudgetCard(traveller, minBudget, minEnergy))
          .join("")}
      </div>
    </section>
    ${groupPreferredActivitiesPanel(payload)}
    <section class="recommendation-note">
      <strong>Recommended itinerary</strong>
      <p>Based on traveller interests, activity options, budgets, energy, and available hours, this is the best itinerary the planner can create by maximizing the group satisfaction score.</p>
    </section>
  `;
}

function groupPreferredActivitiesPanel(payload) {
  const preferredActivities = payload.activities
    .map((activity) => ({
      ...activity,
      interestedTravellers: travellersInterestedInActivity(activity, payload),
    }))
    .filter((activity) => activity.interestedTravellers.length > 0)
    .sort((left, right) => {
      if (right.interestedTravellers.length !== left.interestedTravellers.length) {
        return right.interestedTravellers.length - left.interestedTravellers.length;
      }
      return Number(left.id) - Number(right.id);
    });

  return `
    <section class="preferred-panel">
      <div class="budget-panel-heading">
        <div>
          <span class="step-label">Group preferences</span>
          <h3>Activities Preferred by the Group</h3>
        </div>
        <span class="limit-chip">${preferredActivities.length} matching activities</span>
      </div>
      ${
        preferredActivities.length
          ? `<div class="preferred-list">
              ${preferredActivities.map(preferredActivityCard).join("")}
            </div>`
          : `<div class="preference-empty">No activity currently matches the travellers' selected interests.</div>`
      }
    </section>
  `;
}

function preferredActivityCard(activity) {
  return `
    <article class="preferred-card">
      <div class="preferred-card-main">
        <span class="activity-number">${activity.id}</span>
        <div>
          <h4>${escapeHtml(activity.name)}</h4>
          <p>${money(activity.cost)} per person, ${activity.duration}h, ${activity.energy} energy</p>
        </div>
      </div>
      <div class="preferred-card-meta">
        <span class="tag-pill tag-${activity.tag.toLowerCase()}">${formatTag(activity.tag)}</span>
        <span class="preference-score">${activity.interestedTravellers.length} interested</span>
      </div>
      <p class="preferred-by">Preferred by ${activity.interestedTravellers.map(escapeHtml).join(", ")}</p>
    </article>
  `;
}

function travellersInterestedInActivity(activity, payload) {
  return payload.travellers
    .filter((traveller) => (traveller.interests || []).includes(activity.tag))
    .map((traveller) => traveller.name);
}

function samePlan(leftDays, rightDays) {
  if (leftDays.length !== rightDays.length) return false;
  return leftDays.every((leftDay, index) => sameDayPlan(leftDay, rightDays[index]));
}

function sameDayPlan(leftDay, rightDay) {
  if (!leftDay || !rightDay) return false;
  return (
    Number(leftDay.day) === Number(rightDay.day) &&
    Number(leftDay.cost) === Number(rightDay.cost) &&
    Number(leftDay.energy) === Number(rightDay.energy) &&
    Number(leftDay.duration) === Number(rightDay.duration) &&
    Number(leftDay.satisfaction) === Number(rightDay.satisfaction) &&
    idsKey(leftDay.activityIds) === idsKey(rightDay.activityIds)
  );
}

function idsKey(ids) {
  return [...(ids || [])].map(Number).sort((left, right) => left - right).join(",");
}

function copyPlanDay(day) {
  return {
    ...day,
    activityIds: [...(day.activityIds || [])],
  };
}

function groupLimits(travellers) {
  const activeTravellers = travellers.filter((traveller) => traveller.active !== false);
  if (!activeTravellers.length) {
    return {
      budget: 0,
      energy: 0,
      activeCount: 0,
    };
  }

  return {
    budget: Math.min(...activeTravellers.map((traveller) => Number(traveller.dailyBudget || 0))),
    energy: Math.min(...activeTravellers.map((traveller) => Number(traveller.energy || 0))),
    activeCount: activeTravellers.length,
  };
}

function applyEventToTravellerState(event, travellers) {
  if (event.type === "WEATHER") return;

  const traveller = travellers.find((person) => person.name === event.traveller);
  if (!traveller) return;

  if (event.type === "DROP") {
    traveller.active = false;
  } else if (event.type === "FATIGUE") {
    traveller.energy = Number(event.value);
  } else if (event.type === "BUDGET") {
    traveller.dailyBudget = Number(event.value);
  }
}

function eventLimitMessage(event, beforeLimits, afterLimits) {
  const budgetText = limitChangeText(
    "Daily budget limit",
    beforeLimits.budget,
    afterLimits.budget,
    money,
  );
  const energyText = limitChangeText(
    "Energy limit",
    beforeLimits.energy,
    afterLimits.energy,
    (value) => `${value}`,
  );

  if (event.type === "WEATHER") {
    return `${formatTag(event.tag)} activities are blocked from day ${event.day}. ${budgetText}. ${energyText}.`;
  }

  if (event.type === "DROP") {
    const activeText =
      beforeLimits.activeCount === afterLimits.activeCount
        ? `${afterLimits.activeCount} travellers remain active`
        : `active travellers changed from ${beforeLimits.activeCount} to ${afterLimits.activeCount}`;
    return `${event.traveller} leaves from day ${event.day}; ${activeText}. ${budgetText}. ${energyText}.`;
  }

  if (event.type === "FATIGUE") {
    return `${event.traveller}'s energy is now ${event.value} from day ${event.day}. ${budgetText}. ${energyText}.`;
  }

  return `${event.traveller}'s budget is now ${money(event.value)} from day ${event.day}. ${budgetText}. ${energyText}.`;
}

function limitChangeText(label, beforeValue, afterValue, formatter) {
  if (Number(beforeValue) === Number(afterValue)) {
    return `${label} remains ${formatter(afterValue)}`;
  }
  return `${label} is updated from ${formatter(beforeValue)} to ${formatter(afterValue)}`;
}

function travellerBudgetCard(traveller, minBudget, minEnergy) {
  const isBudgetLimit = Number(traveller.dailyBudget) === minBudget;
  const isEnergyLimit = Number(traveller.energy) === minEnergy;
  const labels = [
    isBudgetLimit ? "budget limit" : "",
    isEnergyLimit ? "energy limit" : "",
  ].filter(Boolean);

  return `
    <article class="traveller-budget-card">
      <div class="title-cluster">
        <span class="avatar">${escapeHtml(initials(traveller.name))}</span>
        <div>
          <h4>${escapeHtml(traveller.name)}</h4>
          <p>${money(traveller.dailyBudget)} budget, ${traveller.energy} energy</p>
        </div>
      </div>
      <div class="traveller-interest-row">
        ${(traveller.interests || [])
          .map((tag) => `<span class="tag-pill tag-${tag.toLowerCase()}">${formatTag(tag)}</span>`)
          .join("")}
      </div>
      ${
        labels.length
          ? `<div class="limit-note">${labels.join(" and ")}</div>`
          : `<div class="limit-note quiet">within group range</div>`
      }
    </article>
  `;
}

function updateTravellerCardPreview(row) {
  const index = Number(row.dataset.index);
  const name = row.querySelector(".traveller-name").value.trim() || `Traveller ${index + 1}`;
  const budget = Number(row.querySelector(".traveller-budget").value || 0);
  const energy = Number(row.querySelector(".traveller-energy").value || 0);

  row.querySelector(".traveller-heading-name").textContent = name;
  row.querySelector(".traveller-heading-meta").textContent = `${money(budget)} budget, ${energy} energy`;
  row.querySelector(".traveller-avatar").textContent = initials(name);
}

function updateTravellerNamesDatalist() {
  const travellers = travellersList.querySelectorAll(".traveller-row").length
    ? collectTravellers()
    : currentInput.travellers;

  travellerNames.innerHTML = travellers
    .map((traveller) => traveller.name)
    .filter(Boolean)
    .map((name) => `<option value="${escapeHtml(name)}"></option>`)
    .join("");
}

function overviewCard(label, value) {
  return `
    <div class="overview-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function summaryTile(label, value, tone) {
  return `
    <div class="summary-tile tone-${tone}">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function tagCheckbox(tag, selectedTags) {
  const checked = selectedTags.includes(tag) ? "checked" : "";
  return `
    <label class="tag-choice">
      <input class="interest-check" type="checkbox" value="${tag}" ${checked} />
      ${formatTag(tag)}
    </label>
  `;
}

function tagOptions(selectedTag) {
  return TAGS.map(
    (tag) => `<option value="${tag}" ${tag === selectedTag ? "selected" : ""}>${formatTag(tag)}</option>`,
  ).join("");
}

function eventLabel(type) {
  return {
    WEATHER: "Weather block",
    DROP: "Traveller drops out",
    FATIGUE: "Energy changes",
    BUDGET: "Budget changes",
  }[type];
}

function describeDraftEvent(event) {
  if (event.type === "WEATHER") return `Blocks ${formatTag(event.tag || "ADVENTURE")} on day ${event.day || 1}`;
  if (event.type === "DROP") return `${event.traveller || "Traveller"} leaves on day ${event.day || 1}`;
  if (event.type === "FATIGUE") return `${event.traveller || "Traveller"} energy becomes ${event.value ?? 50}`;
  if (event.type === "BUDGET") return `${event.traveller || "Traveller"} budget becomes ${money(event.value ?? 50)}`;
  return "Trip change";
}

function describeEvent(event) {
  if (event.type === "WEATHER") return `weather blocks ${formatTag(event.tag)} on day ${event.day}`;
  if (event.type === "DROP") return `${event.traveller} leaves on day ${event.day}`;
  if (event.type === "FATIGUE") return `${event.traveller}'s energy becomes ${event.value} on day ${event.day}`;
  return `${event.traveller}'s budget becomes ${money(event.value)} on day ${event.day}`;
}

function formatTag(tag) {
  return String(tag)
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(value) {
  return `$${Number(value || 0)}`;
}

function initials(name) {
  return String(name || "T")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(text) {
  statusBadge.textContent = text;
  statusBadge.classList.remove("error");
}

function showError(error) {
  statusBadge.textContent = "Error";
  statusBadge.classList.add("error");
  resultOverview.innerHTML = "";
  planSummary.innerHTML = `<div class="error-box">${escapeHtml(error.message)}</div>`;
}
