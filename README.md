# FairTrip Web Planner

## Problem We Solved

Planning a group trip can be surprisingly difficult because every traveller has different:

* Budgets
* Interests
* Activity preferences
* Time constraints

When multiple people are involved, deciding what to do often becomes a manual and time-consuming process. Popular activities may exceed some travellers' budgets, while budget-friendly options may not align with everyone's interests.

Our project solves this problem by automatically generating a fair and balanced trip itinerary that considers the preferences and constraints of the entire group.

---

## How It Works

The user enters trip details through a simple web interface.

This includes:

* Number of trip days
* Available hours per day
* Traveller information
* Individual budgets
* Activity options
* Scheduled events

After clicking **Generate Plan**, the system processes the information through a deterministic planning engine.

### 1. Traveller Analysis Stage

The system analyzes all travellers and their preferences.

For each traveller, it considers:

* Budget limits
* Preferred activities
* Available trip duration

This helps establish the overall interests and constraints of the group.

### 2. Activity Evaluation Stage

The planner evaluates all available activities.

Each activity is analyzed based on:

* Cost
* Duration
* Category
* Popularity among travellers
* Compatibility with group preferences

Activities that satisfy more travellers while respecting budget constraints receive higher priority.

### 3. Fairness & Scheduling Stage

The planner generates a balanced itinerary using deterministic decision-making.

The scheduling engine:

* Allocates activities across available days
* Respects trip time limits
* Prevents scheduling conflicts
* Incorporates fixed events
* Maximizes group satisfaction
* Applies deterministic tie-breaking to ensure consistent results

This ensures that identical inputs always produce identical trip plans.

### 4. Explanation Stage

The system generates plain-English reasoning explaining why activities were selected.

Users can understand:

* Which preferences influenced decisions
* Why certain activities were prioritized
* How the final itinerary was constructed

---

## Output Format

Instead of returning raw JSON, FairTrip Web Planner presents results through an interactive dashboard.

The dashboard displays:

* Trip summary
* Recommended itinerary
* Traveller budget cards
* Group preference insights
* Activity categories
* Scheduled events
* Plain-English planning explanations

This makes the generated plan easy to understand and share.

---

## Key Features

### Intelligent Trip Planning

Generates optimized multi-day itineraries based on traveller preferences and constraints.

### Budget-Aware Recommendations

Ensures suggested activities remain within traveller budget limits.

### Fair Group Decision Making

Balances the interests of all travellers rather than favoring a single person.

### Event-Aware Scheduling

Automatically incorporates fixed events into the itinerary.

### Deterministic Planning Engine

Produces identical results for identical inputs through deterministic tie-breaking.

### Interactive Dashboard

Provides a visual overview of trip recommendations and traveller information.

### Plain-English Reasoning

Explains how and why planning decisions were made.

### Shared Planning Engine

Uses a reusable planning engine across both frontend and backend components.

### API-Driven Architecture

Supports programmatic plan generation through REST endpoints.

### Automated Testing

Validates planner behavior using Node.js's built-in test framework.

---

## Tech Stack

### Backend

* Node.js
* Native HTTP Server
* REST APIs

### Frontend

* HTML
* CSS
* Vanilla JavaScript

### Testing

* Node.js Built-in Test Runner

### Architecture

* Shared JavaScript Planning Engine
* Modular Business Logic
* Deterministic Scheduling Algorithms

---

## User Experience

The application provides a simple form-based interface where users can:

* Add travellers
* Define budgets
* Create activities
* Schedule events
* Generate itineraries instantly

Traveller cards update dynamically while editing, and the generated plan is displayed in a visually organized dashboard.

---

## Why This Matters

FairTrip Web Planner bridges the gap between:

**Manual Group Planning → Automated Fair Trip Recommendations**

Instead of spending hours comparing options and negotiating schedules, groups can generate a balanced itinerary in seconds.

The platform can be useful for:

* Friend groups
* Family vacations
* College trips
* Team outings
* Travel agencies
* Event coordinators

---

## Engineering Highlights

### Deterministic Recommendation Engine

Ensures repeatable and testable outputs.

### Fairness-Oriented Planning

Balances group preferences while respecting constraints.

### Clean Separation of Concerns

Organized into:

* UI Layer
* HTTP/API Layer
* Planning Engine
* Testing Layer

### Zero External Dependencies

Built entirely using native Node.js and browser technologies.

### Testable Business Logic

Core planning functionality remains independent from presentation and networking layers.

### Extensible Architecture

New scheduling strategies and recommendation rules can be added without affecting the UI.

---

## Future Improvements

* User authentication
* Database integration
* Trip sharing and collaboration
* PDF itinerary export
* Map integration
* Weather-aware recommendations
* Cost optimization suggestions
* Mobile application support

---


## Closing

In summary, FairTrip Web Planner transforms complex group travel planning into an automated and transparent process. By combining traveller preferences, budget awareness, event scheduling, and deterministic recommendation logic, the platform generates balanced itineraries that are easy to understand, reproducible, and fair for the entire group.

---

## Demo Video

🎥 Watch the project demonstration here:

**Demo:** [Add Your Video Link Here]
## Live link:
https://trip-planner-two-theta.vercel.app/


