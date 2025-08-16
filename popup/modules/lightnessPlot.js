import Chart from 'chart.js/auto';

let lightnessChart = null;
export function renderLightnessPlot() {
    const data = generateLightnessData();
    // Get the min bright bg trigger threshold from settings (dynamic)
    const minBrightBgTrigger = uDark.userSettings.min_bright_bg_trigger
    // Create an array for the trigger zone: values under threshold, null elsewhere
    const triggerZone = data.rgba_oled.map((v, i) => (data.x[i] <= minBrightBgTrigger ? v : null));
    console.log(data)
    const ctx = document.getElementById('lightnessPlotChart').getContext('2d');
    if (lightnessChart) {
        lightnessChart.data.labels = data.x;
        lightnessChart.data.datasets[0].data = data.revert_rgba;
        lightnessChart.data.datasets[1].data = data.rgba_oled;
        lightnessChart.data.datasets[2].data = triggerZone;
        lightnessChart.update();
        return;
    }
    lightnessChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.x,
            datasets: [
                {
                    label: 'Text Lightness: How text color is transformed (↑ Output Lightness → Input Lightness)',
                    data: data.revert_rgba,
                    borderColor: 'rgba(0,200,255,0.8)',
                    backgroundColor: 'rgba(0,200,255,0.2)',
                    fill: false,
                    tension: 0,
                    pointRadius: 0 // Remove dots
                },
                {
                    label: 'Background Lightness: How background color is transformed (↑ Output Lightness → Input Lightness)',
                    data: data.rgba_oled,
                    borderColor: 'rgba(255,200,0,0.8)',
                    backgroundColor: 'rgba(255,200,0,0.2)',
                    fill: false,
                    tension: 0,
                    pointRadius: 0 // Remove dots
                },
                {
                    label: 'Area below threshold, ignored for darkening',
                    data: triggerZone,
                    borderColor: 'rgba(255,100,100,0.0)', // No border
                    backgroundColor: 'rgba(255,100,100,0.3)', // Light red fill
                    fill: 'origin',
                    tension: 0,
                    pointRadius: 0,
                    order: 0 // Draw below lines
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#fff' } },
                title: { display: false }
            },
            scales: {
                x: {
                    title: { display: true, text: '→ Input Lightness', color: '#fff' },
                    ticks: { color: '#fff' }
                },
                y: {
                    title: { display: true, text: '↑ Output Lightness', color: '#fff' },
                    min: 0, max: 1,
                    ticks: { color: '#fff' }
                }
            }
        }
    });
}
// Module to generate lightness transformation data for uDark.revert_rgb and uDark.rgba_oled
// Assumes uDark is available globally

export function generateLightnessData() {
    const points = 200;
    const data = {
        x: [], // input lightness (0..1)
        revert_rgba: [], // output lightness (0..1)
        rgba_oled: [] // output lightness (0..1)
    };
    for (let i = 0; i <= points; i++) {
        const l = i / points;
        const rgb = Math.round(l * 255);
        // Call uDark functions with render=false, alpha=1
        const revert = uDark.revert_rgba(rgb, rgb, rgb, 1, r=>r/255);
        const oled = uDark.rgba_oled(rgb, rgb, rgb, 1, r=>r/255);
        // Take only R channel, normalize to 0..1
        data.x.push(l);
        data.revert_rgba.push(revert);
        data.rgba_oled.push(oled);
    }
    return data;
}
