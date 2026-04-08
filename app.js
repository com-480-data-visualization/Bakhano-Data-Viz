// app.js

const State = {
  data: [],
  timeRange: null,
  selectedCountries: [],
  subscribers: []
};

// Global state subscriber pattern
function subscribe(callback) {
  State.subscribers.push(callback);
}

function notifySubscribers() {
  let filteredData = State.timeRange 
    ? State.data.filter(d => d.date >= State.timeRange[0] && d.date <= State.timeRange[1])
    : State.data;

  // Apply UI filter
  if (State.selectedCountries.length > 0) {
      filteredData = filteredData.filter(d => State.selectedCountries.includes(d.country));
      
      // Compute adaptive mean across selected countries at each time point
      if (filteredData.length > 0) {
          const dateGroups = d3.group(filteredData, d => d.date.getTime());
          const meanData = [];
          
          dateGroups.forEach((records, timestamp) => {
              const avgValue = d3.mean(records, r => r.value);
              meanData.push({
                  date: new Date(timestamp),
                  category: 'openings',
                  country: 'Average',
                  value: avgValue
              });
          });
          
          // Append the aggregated 'Average' subset
          filteredData = filteredData.concat(meanData);
      }
  } else {
      filteredData = []; // Send empty array to draw skeletons
  }

  State.subscribers.forEach(cb => cb(filteredData));
  
  // Update UI metadata summary
  // We exclude 'Average' from these counts so we don't accidentally display double representation
  const actualCountries = filteredData.filter(d => d.country !== 'Average');
  
  if(actualCountries.length > 0) {
    document.getElementById('summary-obs').innerText = actualCountries.length.toLocaleString();
    const minD = d3.min(actualCountries, d => d.date);
    const maxD = d3.max(actualCountries, d => d.date);
    document.getElementById('summary-span').innerText = `${d3.timeFormat('%Y-%m')(minD)} \u2192 ${d3.timeFormat('%Y-%m')(maxD)}`;
    
    const rollups = d3.rollup(actualCountries, v => d3.mean(v, d => d.value), d => d.country);
    let maxMean = 0;
    let maxCountry = '-';
    rollups.forEach((val, key) => {
       if(val > maxMean) { maxMean = val; maxCountry = key; }
    });
    document.getElementById('summary-top').innerText = maxCountry;
  } else {
    document.getElementById('summary-obs').innerText = '0';
    document.getElementById('summary-span').innerText = '-';
    document.getElementById('summary-top').innerText = '-';
  }
}

function updateTimeRange(newRange) {
  State.timeRange = newRange;
  notifySubscribers();
}

function toggleCountry(country) {
  if(State.selectedCountries.includes(country)) {
    State.selectedCountries = State.selectedCountries.filter(c => c !== country);
  } else {
    State.selectedCountries.push(country);
  }
  renderCountryFilters(); 
  notifySubscribers();
}

function toggleAllCountries(countriesArray) {
  if (State.selectedCountries.length === countriesArray.length) {
      State.selectedCountries = [];
  } else {
      State.selectedCountries = [...countriesArray];
  }
  renderCountryFilters();
  notifySubscribers();
}

const config = {
    basePath: './Data/Indeed_job_posting/',
    countries: ['AU', 'CA', 'DE', 'FR', 'GB', 'IE', 'US']
};

function renderCountryFilters() {
  const container = document.getElementById('legend-container');
  if(!container) return;
  container.innerHTML = ''; // Rebuild
  
  // All Button
  const allBtn = document.createElement('button');
  const allSelected = State.selectedCountries.length === config.countries.length;
  allBtn.className = `px-3 py-1 rounded text-xs font-semibold transition-all duration-200 border ${allSelected ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`;
  allBtn.innerText = allSelected ? 'Deselect All' : 'Select All';
  allBtn.onclick = () => toggleAllCountries(config.countries);
  container.appendChild(allBtn);

  // Country Map Chips
  config.countries.forEach(country => {
    const isSelected = State.selectedCountries.includes(country);
    const chip = document.createElement('button');
    // Leverage colors from charts.js globals
    const color = typeof COLORS !== 'undefined' ? COLORS[country] : '#94a3b8';
    
    chip.className = `flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border outline-none ${isSelected ? 'border-transparent text-white shadow-sm' : 'border-slate-600/50 text-slate-400 bg-transparent hover:bg-slate-700/50'}`;
    if (isSelected) {
       chip.style.backgroundColor = `${color}40`; // low opacity tinted bg
    }
    
    chip.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full transition-colors duration-200" style="background:${isSelected ? color : '#475569'}; box-shadow: 0 0 4px ${isSelected ? color : 'transparent'}"></span>
      ${country}
    `;
    chip.onclick = () => toggleCountry(country);
    container.appendChild(chip);
  });
}

/**
 * Main Data Loader
 */
async function loadData() {
  const allData = [];

  try {
    const promises = config.countries.map(country => {
      const filename = `IHLIDXNSA${country}.csv`;
      return d3.csv(config.basePath + filename, d => {
        return {
          date: d3.timeParse('%Y-%m-%d')(d.observation_date),
          category: 'openings', // standardized field
          country: country,
          value: parseFloat(d[`IHLIDXNSA${country}`])
        };
      });
    });

    const results = await Promise.all(promises);
    
    // Agglomerate into a singular Long Format array
    results.forEach(countryData => allData.push(...countryData));
    
    if (allData.length === 0) throw new Error("No data arrays returned.");

    // Filter invalid entries
    const cleanData = allData.filter(d => d.date && !isNaN(d.value));

    // Sort globally by chronological date for performance inside charts
    cleanData.sort((a, b) => a.date - b.date);
    
    State.data = cleanData;
    State.timeRange = d3.extent(cleanData, d => d.date);
    State.selectedCountries = [...config.countries]; // Init with all active

    // Hide initial visual loader
    const loader = document.getElementById('line-chart-loader');
    if (loader) {
       loader.style.opacity = '0';
       setTimeout(() => loader.style.display = 'none', 300);
    }
    
    renderCountryFilters();
    initDashboard();

  } catch (err) {
    console.error("Critical Load Error: If accessing via 'file://', browsers block local CSV fetching due to CORS.", err);
    const loader = document.getElementById('line-chart-loader');
    if (loader && loader.style.display !== 'none') {
        loader.innerHTML = `<span class="text-sm font-medium text-red-400 bg-red-400/10 px-4 py-2 rounded-lg border border-red-500/20 shadow">Data Load Blocked. Please serve via local live-server.</span>`;
    }
  }
}

/**
 * Initializes and wires up modules.
 */
function initDashboard() {
  const mapping = { x: 'date', y: 'value', group: 'country' };

  // 1. Line Chart Component
  const lineChart = createLineChart('#job-openings-chart', [], mapping);
  subscribe(data => lineChart.update(data));

  // 2. Bar Chart Component
  const barChart = createBarChart('#avg-openings-chart', [], mapping);
  subscribe(data => barChart.update(data));

  // 3. Global Brush/Slider Component
  createBrushTimeline('#global-brush-container', State.timeRange, (newExt) => {
    updateTimeRange(newExt);
  });

  // Initial populate (triggers skeleton if empty, or data otherwise)
  notifySubscribers();
  
  // Handle Resize Events manually for responsive SVG viewBox
  window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
        if(State.data.length > 0) {
            // Note: In an optimized system, we'd fire an update with transition=0
            // but re-invoking notifySubscribers will correctly rebuild charts using auto scales
            notifySubscribers();
        }
    }, 200);
  });
}

// Execute application
document.addEventListener('DOMContentLoaded', loadData);
