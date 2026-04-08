// charts.js
// D3 Component Pattern (The Factory)

const COLORS = {
  AU: '#ef4444', 
  CA: '#f97316', 
  DE: '#22c55e', 
  FR: '#ec4899', 
  GB: '#8b5cf6', 
  IE: '#14b8a6', 
  US: '#3b82f6'  
};

function getCountryColor(code) {
  return COLORS[code] || '#94a3b8';
}

/**
 * Creates a D3 multi-series line chart
 */
function createLineChart(containerSelector, initialData, mapping) {
  const container = d3.select(containerSelector);
  const containerNode = container.node();
  
  container.selectAll('svg').remove();
  
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  
  const svg = container.append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('preserveAspectRatio', 'xMidYMid meet');
    
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  
  const x = d3.scaleTime();
  const y = d3.scaleLinear();

  const xAxisGroup = g.append('g');
  const yAxisGroup = g.append('g');

  const pathsGroup = g.append('g').attr('class', 'paths-group');
  
  const hoverLayer = g.append('rect')
    .attr('class', 'hover-layer')
    .attr('fill', 'none')
    .attr('pointer-events', 'all');
    
  const hoverLine = g.append('line')
    .attr('class', 'hover-line')
    .attr('stroke', '#64748b')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4')
    .style('opacity', 0);
  
  const tooltip = d3.select('#tooltip');

  // We need a fallback extent if empty
  let lastValidExtentX = [new Date(2021,0,1), new Date()];

  function update(data, transitionDuration = 500) {
    if(!containerNode) return;
    
    const safeData = data || [];
    
    const width = containerNode.clientWidth - margin.left - margin.right;
    const height = containerNode.clientHeight - margin.top - margin.bottom;
    if(width <= 0 || height <= 0) return;
    
    svg.attr('viewBox', `0 0 ${containerNode.clientWidth} ${containerNode.clientHeight}`);
    hoverLayer.attr('width', width).attr('height', height);

    const grouped = d3.group(safeData, d => d[mapping.group]);
    
    let extentX = d3.extent(safeData, d => d[mapping.x]);
    if(extentX[0]) lastValidExtentX = extentX;
    else extentX = lastValidExtentX;
    
    x.domain(extentX).range([0, width]);
    
    let minY = d3.min(safeData, d => d[mapping.y]);
    let maxY = d3.max(safeData, d => d[mapping.y]);
    if(minY === undefined) { minY = 0; maxY = 100; }
    
    y.domain([Math.min(0, minY), maxY * 1.05]).range([height, 0]);

    xAxisGroup
      .attr('transform', `translate(0,${height})`)
      .transition().duration(transitionDuration)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %Y')))
      .call(g => g.select(".domain").attr("stroke", "#475569"))
      .call(g => g.selectAll(".tick line").attr("stroke", "#475569"))
      .call(g => g.selectAll(".tick text").attr("fill", "#94a3b8"));

    yAxisGroup
      .transition().duration(transitionDuration)
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.select(".domain").attr("stroke", "#475569"))
      .call(g => g.selectAll(".tick line").attr("stroke", "#475569").attr("stroke-dasharray", "2,2"))
      .call(g => g.selectAll(".tick text").attr("fill", "#94a3b8"));

    const line = d3.line()
      .x(d => x(d[mapping.x]))
      .y(d => y(d[mapping.y]))
      .curve(d3.curveMonotoneX);

    const paths = pathsGroup.selectAll('.line-path')
      .data(Array.from(grouped.entries()), d => d[0]);

    const pathsEnter = paths.enter()
      .append('path')
      .attr('class', 'line-path')
      .attr('fill', 'none')
      .attr('stroke-width', 2)
      .attr('stroke', d => getCountryColor(d[0]))
      .attr('d', d => line(d[1]))
      .attr('opacity', 0);

    pathsEnter.merge(paths)
      .transition().duration(transitionDuration)
      .attr('d', d => line(d[1]))
      .attr('opacity', 1);

    paths.exit()
      .transition().duration(transitionDuration)
      .attr('opacity', 0)
      .remove();
      
    const bisectDate = d3.bisector(d => d[mapping.x]).left;

    hoverLayer.on('mousemove', function(event) {
      if(!grouped.size) return;
      const x0 = x.invert(d3.pointer(event)[0]);
      
      const activePoints = [];
      grouped.forEach((values, key) => {
        const i = bisectDate(values, x0, 1);
        const d0 = values[i - 1];
        const d1 = values[i];
        let d = d0;
        if(d1 && d0) {
           d = x0 - d0[mapping.x] > d1[mapping.x] - x0 ? d1 : d0;
        } else if (d1) {
           d = d1;
        }
        if(d) activePoints.push({key, d});
      });
      
      if(activePoints.length === 0) return;
      
      const hoveredDate = activePoints[0].d[mapping.x];
      const hoverX = x(hoveredDate);
      
      hoverLine
        .attr('x1', hoverX)
        .attr('x2', hoverX)
        .attr('y1', 0)
        .attr('y2', height)
        .style('opacity', 1);
        
      let html = `<div class="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-2">${d3.timeFormat('%B %d, %Y')(hoveredDate)}</div>`;
      activePoints.sort((a,b) => b.d[mapping.y] - a.d[mapping.y]).forEach(pt => {
        html += `<div class="flex items-center gap-2 mb-1">
          <span class="w-3 h-3 rounded-full" style="background:${getCountryColor(pt.key)}"></span>
          <span class="text-xs font-semibold text-slate-300 w-8">${pt.key}</span>
          <span class="text-sm font-mono text-white">${pt.d[mapping.y].toFixed(1)}</span>
        </div>`;
      });
      
      tooltip.html(html)
        .style('opacity', 1)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY + 15) + 'px');
    })
    .on('mouseout', function() {
      hoverLine.style('opacity', 0);
      tooltip.style('opacity', 0);
    });
  }

  if (initialData && initialData.length > 0) {
    update(initialData, 0);
  } else {
    update([], 0); // draw skeleton
  }

  return { update };
}

/**
 * Creates a simple bar chart
 */
function createBarChart(containerSelector, initialData, mapping) {
  const container = d3.select(containerSelector);
  const containerNode = container.node();
  
  container.selectAll('svg').remove();
  
  const margin = { top: 10, right: 10, bottom: 20, left: 30 };
  const svg = container.append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('preserveAspectRatio', 'xMidYMid meet');
    
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  
  const x = d3.scaleBand().padding(0.3);
  const y = d3.scaleLinear();
  
  const xAxisGroup = g.append('g');
  const yAxisGroup = g.append('g');
  const barsGroup = g.append('g');

  function update(data, transitionDuration = 500) {
    if(!containerNode) return;
    
    const safeData = data || [];
    const width = containerNode.clientWidth - margin.left - margin.right;
    const height = containerNode.clientHeight - margin.top - margin.bottom;
    if(width <= 0 || height <= 0) return;
    
    svg.attr('viewBox', `0 0 ${containerNode.clientWidth} ${containerNode.clientHeight}`);
    
    const rollups = d3.rollup(safeData, v => d3.mean(v, d => d[mapping.y]), d => d[mapping.group]);
    const summaryData = Array.from(rollups, ([key, value]) => ({ key, value }))
      .sort((a,b) => b.value - a.value);

    // Keep previous domain if empty so axes don't break visually, or fallback
    x.domain(summaryData.length ? summaryData.map(d => d.key) : []).range([0, width]);
    const maxY = summaryData.length ? d3.max(summaryData, d => d.value) : 100;
    y.domain([0, maxY * 1.1]).range([height, 0]);

    xAxisGroup
      .attr('transform', `translate(0,${height})`)
      .transition().duration(transitionDuration)
      .call(d3.axisBottom(x))
      .call(g => g.select(".domain").attr("stroke", "#475569"))
      .call(g => g.selectAll(".tick line").attr("stroke", "#475569"))
      .call(g => g.selectAll(".tick text").attr("fill", "#94a3b8"));

    yAxisGroup
      .transition().duration(transitionDuration)
      .call(d3.axisLeft(y).ticks(4))
      .call(g => g.select(".domain").attr("stroke", "#475569"))
      .call(g => g.selectAll(".tick line").attr("stroke", "#475569"))
      .call(g => g.selectAll(".tick text").attr("fill", "#94a3b8"));

    const bars = barsGroup.selectAll('.bar').data(summaryData, d => d.key);

    bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.key))
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', d => getCountryColor(d.key))
      .attr('rx', 2)
      .merge(bars)
      .transition().duration(transitionDuration)
      .attr('x', d => x(d.key))
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.value))
      .attr('height', d => height - y(d.value));

    bars.exit()
      .transition().duration(transitionDuration)
      .attr('y', height)
      .attr('height', 0)
      .remove();
  }

  if (initialData && initialData.length > 0) {
    update(initialData, 0);
  } else {
    update([], 0);
  }

  return { update };
}

/**
 * Creates a global D3 brush for time filtering
 */
function createBrushTimeline(containerSelector, timeExtent, onBrushCallback) {
  const container = d3.select(containerSelector);
  const containerNode = container.node();
  container.selectAll('svg').remove();
  
  if(!timeExtent || !timeExtent[0]) timeExtent = [new Date(2021,0,1), new Date()];
  
  const margin = { top: 0, right: 10, bottom: 15, left: 10 };
  const width = containerNode.clientWidth - margin.left - margin.right;
  const height = containerNode.clientHeight - margin.top - margin.bottom;
  
  const svg = container.append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('viewBox', `0 0 ${containerNode.clientWidth} ${containerNode.clientHeight}`);
    
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  
  const x = d3.scaleTime()
    .domain(timeExtent)
    .range([0, width]);

  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(6).tickSizeOuter(0))
    .call(ax => ax.select(".domain").attr("stroke", "transparent"))
    .call(ax => ax.selectAll(".tick line").attr("stroke", "#475569"))
    .call(ax => ax.selectAll(".tick text").attr("fill", "#64748b").attr("font-size", "10px"));

  const brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on('brush end', (event) => {
      if(!event.selection) {
         onBrushCallback(timeExtent);
         return;
      }
      const selectedRange = event.selection.map(x.invert);
      onBrushCallback(selectedRange);
    });

  g.append('g')
    .attr('class', 'brush')
    .call(brush)
    .call(brush.move, x.range()); 
    
  return {
     updateSelection: (newExtent) => {
        g.select('.brush').call(brush.move, newExtent.map(x));
     }
  };
}
