# Role: Senior Data Visualization Engineer & D3.js Expert

## The Goal
Build a scalable, interactive dashboard skeleton for Job Market Analytics (Layoffs, Hiring, and Job Openings). The architecture must be "Data-Agnostic," meaning I can add new CSV-based datasets in the future with minimal code changes.

## Core Technical Requirements

### 1. Data Architecture (CSV-First)
* **Standardized Parser:** Create a central data-loading module using `d3.csv()`. 
* **Data Schema:** The system should expect a "Long Format" CSV (Columns: Date, Category, Country, Value). Include a helper function to parse date strings into JS Date objects and numeric strings into floats.
* **Extensibility:** Use a "Registry" or "Configuration Object" approach. To add a new dataset, I should only need to add a new entry to a config object (defining the file path and chart type) rather than writing new D3 logic.

### 2. D3.js Component Pattern (The Factory)
* **Reusable Chart Functions:** Do not write standalone scripts for each chart. Create a reusable `createLineChart` and `createBarChart` function.
* **Parameters:** These functions should accept: `containerSelector`, `data`, and a `mapping` object (e.g., `{ x: 'date', y: 'openings', group: 'country' }`).
* **The Comparison Widget:** The "Job Openings" widget must support multiple line series (one per country) with a dynamic legend and hover tooltips using `d3.bisect`.

### 3. Interactivity & State Management
* **Global Time Filter:** Implement a single time-range slider (or D3 brush). When moved, it must trigger an update across all active charts.
* **Smooth Transitions:** Use `.transition()` and `.duration(500)` for all axis and path updates so the data "morphs" smoothly when the time window changes.
* **Responsive Design:** Ensure the SVGs use a `viewBox` attribute or a resize observer so they scale within a CSS Grid layout.

### 4. UI/UX Specifications
* **Layout:** A clean, modern dashboard grid (Sidebar for navigation, Top-bar for global filters, Main area for widgets).
* **Tech Stack:** Vanilla JavaScript (ES6+), D3.js v7, and Tailwind CSS for the dashboard skeleton/layout.

## Final Output Instructions
1. Provide the code in three clear sections: `index.html` (Layout), `app.js` (Logic/State), and `charts.js` (D3 Components).
2. Include a sample `mockData.csv` structure within a comment block so I know how to format my files.
3. **STOP and ask clarifying questions** if you are unsure about:
    * The specific CSV structure (Long vs. Wide format).
    * How to handle missing data points in a time series.
    * The preferred method for managing global state (simple object vs. custom event bus).