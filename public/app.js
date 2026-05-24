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
}

function renderTravellers() {
  travellersList.innerHTML = currentInput.travellers
    .map(
      (traveller, index) => `
        <article class="item-card traveller-row" data-index="${index}">
          <div class="item-title">
            <h3>Traveller ${index + 1}</h3>
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

  travellerNames.innerHTML = currentInput.travellers
    .map((traveller) => `<option value="${escapeHtml(traveller.name)}"></option>`)
    .join("");
}

function renderActivities() {
  activitiesList.innerHTML = currentInput.activities
    .map(
      (activity, index) => `
        <article class="item-card activity-row" data-index="${index}">
          <div class="item-title">
            <h3>Activity ${index + 1}</h3>
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
        <h3>Event ${index + 1}</h3>
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

  planSummary.appendChild(planSection("Initial plan", report.initialPlan, payload, activityMap));

  report.events.forEach((eventReport) => {
    const sectionTitle = `After event ${eventReport.eventIndex}: ${describeEvent(eventReport.event)}`;
    planSummary.appendChild(planSection(sectionTitle, eventReport.replannedDays, payload, activityMap));
  });
}

function planSection(title, days, payload, activityMap) {
  const section = document.createElement("section");
  section.className = "report-section";

  const heading = document.createElement("h3");
  heading.textContent = title;

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
                <span>${formatTag(activity.tag)}</span>
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
  planSummary.innerHTML = `<div class="error-box">${escapeHtml(error.message)}</div>`;
}
