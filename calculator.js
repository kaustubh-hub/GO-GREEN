/* ===========================================================
   Carbon Footprint Calculator - calculation + display logic
   Use in CAL.html by replacing the existing <script> block with:
       <script src="calculator.js"></script>
   =========================================================== */

/* ---------- Emission factors (kg CO2e per unit) ----------
   Edit these to match your region / data source.
   Defaults are US EPA-style averages, matching your input units
   (kWh, therms, miles).
   For India, a typical grid factor is ~0.71-0.82 kg/kWh
   (CEA data), so change ELECTRICITY_FACTOR if you prefer that. */
const ELECTRICITY_FACTOR = 0.386;   // kg CO2 per kWh
const GAS_FACTOR         = 5.31;    // kg CO2 per therm of natural gas
const DRIVING_FACTOR     = 0.404;   // kg CO2 per mile (average passenger car)
const WEEKS_PER_MONTH    = 52 / 12; // converts weekly miles -> monthly

/* Reference: average person's annual footprint (tonnes CO2e) */
const WORLD_AVG_TONNES = 4.7;
const US_AVG_TONNES    = 16;

/* ---------- Small style fix so the bars actually draw ---------- */
(function injectBarStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .bar { height: 220px; display: flex; flex-direction: column; justify-content: flex-end; }
        .bar-fill { width: 100%; height: 0; border-radius: 10px 10px 0 0; transition: height 1s ease; }
        .bar-label { padding: 8px 4px; }
        .result-line { display: block; font-size: 1.1rem; font-weight: 400; color: #fff; margin-top: 6px; }
        @media (max-width: 768px) { .bar { height: 120px; } }
    `;
    document.head.appendChild(style);
})();

/* ---------- Core calculation ---------- */
function calculateFootprint(electricityKwh, gasTherms, weeklyMiles) {
    const electricity = electricityKwh * ELECTRICITY_FACTOR;
    const gas         = gasTherms * GAS_FACTOR;
    const driving     = weeklyMiles * WEEKS_PER_MONTH * DRIVING_FACTOR;

    const monthlyTotal = electricity + gas + driving;   // kg CO2e / month
    const annualTonnes = (monthlyTotal * 12) / 1000;    // tonnes CO2e / year

    return { electricity, gas, driving, monthlyTotal, annualTonnes };
}

/* ---------- Display results ---------- */
function showResults(r) {
    // Total
    const vsWorld = ((r.annualTonnes / WORLD_AVG_TONNES) * 100).toFixed(0);
    document.getElementById('result').innerHTML =
        `Your footprint: ${r.monthlyTotal.toFixed(1)} kg CO₂ / month` +
        `<span class="result-line">≈ ${r.annualTonnes.toFixed(2)} tonnes CO₂ / year</span>` +
        `<span class="result-line">${vsWorld}% of the world average (${WORLD_AVG_TONNES} t/yr)</span>`;

    // Breakdown bars
    const breakdown = document.getElementById('breakdown');
    breakdown.style.display = 'block';

    const parts = [
        { id: 'electricityBar', label: 'Electricity', value: r.electricity },
        { id: 'gasBar',         label: 'Gas',         value: r.gas },
        { id: 'milesBar',       label: 'Driving',     value: r.driving }
    ];
    const MAX_BAR_PX = 150;
    const total = r.monthlyTotal || 1;
    const largest = Math.max(...parts.map(p => p.value), 1);

    parts.forEach(p => {
        const fill = document.getElementById(p.id);
        const pct = (p.value / total) * 100;
        const heightPx = Math.max((p.value / largest) * MAX_BAR_PX, p.value > 0 ? 4 : 0);
        fill.style.height = '0px';
        // trigger the CSS transition
        requestAnimationFrame(() => requestAnimationFrame(() => {
            fill.style.height = heightPx + 'px';
        }));
        fill.nextElementSibling.innerHTML =
            `${p.label}<br>${p.value.toFixed(1)} kg<br>(${pct.toFixed(0)}%)`;
    });

    // Personalised tips
    showTips(r);
    document.getElementById('tips').style.display = 'block';

    // Scroll to the result
    document.getElementById('result').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ---------- Personalised tips ---------- */
function showTips(r) {
    const tips = [];
    const total = r.monthlyTotal || 1;

    // Tips for the biggest contributor first
    const sorted = [
        { key: 'electricity', value: r.electricity },
        { key: 'gas',         value: r.gas },
        { key: 'driving',     value: r.driving }
    ].sort((a, b) => b.value - a.value);

    const tipBank = {
        electricity: [
            '💡 Switch to LED bulbs and 5-star rated appliances to cut electricity use.',
            '🔌 Unplug chargers and devices on standby - phantom load adds up.',
            '☀️ Consider rooftop solar or a green-energy tariff from your provider.'
        ],
        gas: [
            '🔥 Lower your water heater temperature and take shorter showers.',
            '🏠 Improve insulation and seal drafts to reduce heating needs.',
            '🍳 Consider induction cooking or a heat-pump water heater.'
        ],
        driving: [
            '🚌 Use public transport, cycle or walk for short trips.',
            '🚗 Carpool a few days a week to halve your commute emissions.',
            '⚡ Consider an electric or hybrid vehicle for your next car.'
        ]
    };

    sorted.forEach((item, i) => {
        if (item.value / total > 0.25 || i === 0) {
            tips.push(...tipBank[item.key].slice(0, i === 0 ? 3 : 1));
        }
    });

    if (r.annualTonnes <= WORLD_AVG_TONNES) {
        tips.push('🌱 Great job - you are below the world average! Keep it up and inspire others.');
    } else if (r.annualTonnes > US_AVG_TONNES) {
        tips.push('⚠️ Your footprint is above the US average - small changes in your top category will make a big difference.');
    }
    tips.push('🌳 Offset what you cannot cut: plant trees or support verified offset projects.');

    document.getElementById('tipList').innerHTML = tips.map(t => `<li>${t}</li>`).join('');
}

/* ---------- Form handling ---------- */
document.getElementById('footprintForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const electricity = parseFloat(document.getElementById('electricity').value);
    const gas         = parseFloat(document.getElementById('gas').value);
    const miles       = parseFloat(document.getElementById('miles').value);

    if ([electricity, gas, miles].some(v => isNaN(v) || v < 0)) {
        document.getElementById('result').innerText = 'Please enter valid, non-negative numbers.';
        return;
    }

    const results = calculateFootprint(electricity, gas, miles);
    showResults(results);

    // Optional: remember the last result (used by other pages, e.g. Emission Stats)
    try {
        localStorage.setItem('lastFootprint', JSON.stringify({
            ...results,
            date: new Date().toISOString()
        }));
    } catch (err) { /* storage unavailable - ignore */ }
});

/* ---------- Login state (from your original code) ---------- */
window.onload = function () {
    const loggedIn = localStorage.getItem('loggedIn');
    const userName = localStorage.getItem('userName');
    if (loggedIn === 'true' && userName) {
        document.getElementById('profileInfo').style.display = 'block';
        document.getElementById('userName').innerText = userName;
        const loginLink = document.querySelector('.profile-login a');
        if (loginLink) loginLink.style.display = 'none';
    }
};

function logout() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';
}
