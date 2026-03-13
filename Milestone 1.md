# Milestone 1 

## Dataset

To investigate post-COVID labor market recovery, sector volatility, and emerging influences like AI/automation, we use three complementary high-quality time-series datasets from FRED (Federal Reserve Economic Data / BLS & OECD).

### 1. OECD New Hires by Country (Monthly, Seasonally Adjusted)  
**Source:** https://fred.stlouisfed.org/release/tables?rid=476&eid=1233427  
Monthly new employee hires/rates for ~20–30 OECD countries (e.g., USA, UK, Germany, France, Japan, Australia, Canada, Korea) from ~Feb 2020 onward (OECD Employment Database via FRED). Units: often % of employment or index.  
**Quality:** Official, seasonally adjusted, minimal gaps post-2020.  
**Preprocessing:** Download per-country CSVs → align dates → standardize units → merge panel → normalize (e.g., by employment/population) for comparison.

### 2. U.S. Job Openings Rate: Information Sector (`JTU5100JOR`)  
**Source:** https://fred.stlouisfed.org/series/JTU5100JOR  
Monthly rate (%) of unfilled job openings in U.S. information sector (NAICS 51: tech/media/telecom), from Dec 2000 to Dec 2025.  
**Quality:** BLS JOLTS official : complete, not seasonally adjusted here but trends clear.  
**Preprocessing:** CSV download, date parsing, compute YoY changes/rolling stats.

### 3. U.S. Layoffs & Discharges Rate: Information Sector (`JTU5100LDR`)  
**Source:** https://fred.stlouisfed.org/series/JTU5100LDR  
Monthly layoffs/discharges rate (%) in same sector, from Dec 2000 to Dec 2025.  
**Quality:** Same as above.  
**Preprocessing:** Merge with openings; derive ratios (e.g., openings-to-layoffs).

**Overall preprocessing:** Pandas merge on date (focus post-Feb 2020: ~70 obs/series), linear interpolation for rare gaps, create volatility/gap metrics. No scraping, direct FRED CSVs.

## Problematic

Global labor markets have shown uneven recovery since 2020: strong rebounds in many countries but boom-bust cycles in U.S. tech/media (information sector) amidst AI restructuring and economic shifts. Central question: **How does international hiring resilience compare to U.S. information-sector volatility in job openings vs. layoffs?**

*Main axis:* The "Labor Market Volatility Gap", stable/strong OECD hiring trends vs. amplified U.S. sector demand (openings) followed by corrections (layoffs).

The analysis aims to highlight differences in i) post-2020 hiring dynamics between resilient and more fragile countries. In particular, it focuses on the ii) extreme fluctuations observed in the U.S. information sector, which experienced a strong hiring boom between 2021 and 2022 followed by a significant slowdown and wave of layoffs in 2025–2026. By examining these patterns, the study also explores whether iii) technology and media sectors have begun to diverge from broader labor market trends.

Our motivation for this project is, amid AI job fears and tech layoff waves, visualizing these series to make economic trends intuitive into revealing real opportunities/risks.

The target audience includes tech and job seekers, economists, HR and policy professionals, and journalists interested in labor market dynamics.

## Exploratory Data Analysis

**Key insights & basic statistics:**

**Important note:** The values and statistics below are not derived from exact computation on fully downloaded and processed datasets. They are approximate figures and trends based on directly visible monthly observations, graphs, and tables on the FRED website (series pages & BLS JOLTS releases, as of early 2026), plus general patterns reported in economic summaries. Exact means, standard deviations, correlations, etc. will be computed later in Python (pandas) once the CSVs are fully downloaded and pre-processed.


- **OECD new hires (post-2020):** Varied recovery; many countries (e.g., Germany, Japan) stabilized near pre-pandemic levels by 2023–2025 with low volatility. U.S./UK more cyclical. Average monthly hire rates ~2–4% across countries; U.S. often higher but volatile.

- **U.S. Information sector openings rate (JTU5100JOR):** Right-skewed post-2020. Peaked ~7–8% during 2021–2022 tech boom. Sharp decline in 2025: Sep 2025: 6.7%, Oct: 4.0%, Nov: 2.5%, Dec: 2.9% (latest). Recent trend: downward (from highs to below historical norms). Range post-2020: ~2–8%; mean ~4–5% (estimated from trends).

- **U.S. Information sector layoffs rate (JTU5100LDR):** Zero-inflated baseline (~1–1.5%). Spikes in 2020 (~4% COVID). Low during 2021–2022 boom, then elevated 2023–2025. Recent: Aug–Dec 2025 mostly 1.4–1.7% (Dec 2025: 1.7%). Mean post-2020 ~1.4–1.6%; recent uptick signals correction.

- **Correlations & outliers:** Openings & layoffs negatively correlated (~ –0.4 to –0.5 within sector); openings amplify broader U.S. trends but with extremes. Key outliers: 2021–2022 high openings (demand boom), 2025 declining openings + rising layoffs (AI/restructuring signal). Sector often decouples from OECD averages (e.g., U.S. hires steady while sector contracts).

Here are some interesting graphs related to these numbers :

**Planned visuals (placeholders):**
- Time-series overlay: OECD countries + U.S. sector openings/layoffs (multi-line chart)
- Gap scatter: openings rate vs. layoffs rate over time (with trend line & labeled booms/busts)
- Country ranking bar: post-2020 hire growth

## Related Work

**Existing work:**
- BLS monthly JOLTS reports & FRED blogs track aggregate/sector openings, hires, layoffs
- OECD Employment Outlooks (2023–2025) discuss cross-country hiring/tenure
- Media (Reuters, Bloomberg, NYT, HiringLab) chart JOLTS information series during tech layoff waves; analyses link to AI/automation

**What are we adding:**
Few combine OECD international hires as "global benchmark" with U.S. sector-level openings + layoffs in one view. The "volatility gap" framing highlights tech exceptionalism vs. broader recovery, beyond aggregate dashboards (FRED/OECD) or sector-only reports.

The visual design draws inspiration from several well-known data sources and journalistic styles, including the layered multi-line time series used by FRED, the industry comparison bars from BLS JOLTS releases, and the country dashboards and heatmaps produced by the OECD. It also follows the approach of NYT Upshot and Reuters trackers, which emphasize annotated trend lines and clear labeling of outliers, as well as the clean and readable multi-series charts commonly used by FiveThirtyEight for economic analysis.

---
