// Detailed Performance Analysis - HSL to RGB
// This breaks down exactly where the browser method spends time

{
    console.log("🔬 Detailed Performance Analysis");
    console.log("================================");
    
    const testSpan = document.createElement('span');
    testSpan.style.position = 'absolute';
    testSpan.style.visibility = 'hidden';
    document.body.appendChild(testSpan);
    
    const iterations = 50000;
    
    // Test 1: Just the DOM style setting
    console.log("\n1️⃣ Testing DOM Style Setting Only:");
    let start = performance.now();
    for (let i = 0; i < iterations; i++) {
        const h = Math.round(Math.random() * 360);
        const s = Math.round(Math.random() * 100);
        const l = Math.round(Math.random() * 100);
        testSpan.style.color = `hsl(${h}, ${s}%, ${l}%)`;
    }
    let styleTime = performance.now() - start;
    console.log(`  DOM style writes: ${styleTime.toFixed(2)}ms`);
    
    // Test 2: Just getComputedStyle calls
    console.log("\n2️⃣ Testing getComputedStyle Only:");
    testSpan.style.color = 'hsl(180, 50%, 50%)'; // Set once
    start = performance.now();
    for (let i = 0; i < iterations; i++) {
        getComputedStyle(testSpan).color;
    }
    let computedTime = performance.now() - start;
    console.log(`  getComputedStyle calls: ${computedTime.toFixed(2)}ms`);
    
    // Test 3: Just string parsing
    console.log("\n3️⃣ Testing String Parsing Only:");
    const rgbStrings = [];
    for (let i = 0; i < 100; i++) {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        rgbStrings.push(`rgb(${r}, ${g}, ${b})`);
    }
    
    start = performance.now();
    for (let i = 0; i < iterations; i++) {
        const rgbString = rgbStrings[i % rgbStrings.length];
        const match = rgbString.match(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/);
        if (match) {
            [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        }
    }
    let parseTime = performance.now() - start;
    console.log(`  String parsing: ${parseTime.toFixed(2)}ms`);
    
    // Test 4: Your custom method (math only)
    console.log("\n4️⃣ Testing Custom Math Only:");
    start = performance.now();
    for (let i = 0; i < iterations; i++) {
        const h = Math.random();
        const s = Math.random();
        const l = Math.random();
        uDark.hslToRgb(h, s, l);
    }
    let mathTime = performance.now() - start;
    console.log(`  Pure math: ${mathTime.toFixed(2)}ms`);
    
    // Test 5: Full browser method
    console.log("\n5️⃣ Testing Full Browser Method:");
    start = performance.now();
    for (let i = 0; i < iterations; i++) {
        const h = Math.random();
        const s = Math.random();
        const l = Math.random();
        
        const hDeg = Math.round(h * 360);
        const sPercent = Math.round(s * 100);
        const lPercent = Math.round(l * 100);
        
        testSpan.style.color = `hsl(${hDeg}, ${sPercent}%, ${lPercent}%)`;
        const computedColor = getComputedStyle(testSpan).color;
        const match = computedColor.match(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/);
        if (match) {
            [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        }
    }
    let fullBrowserTime = performance.now() - start;
    console.log(`  Full browser method: ${fullBrowserTime.toFixed(2)}ms`);
    
    // Analysis
    console.log("\n📊 Performance Breakdown:");
    console.log(`  DOM writes:       ${styleTime.toFixed(2)}ms (${(styleTime/fullBrowserTime*100).toFixed(1)}%)`);
    console.log(`  getComputedStyle: ${computedTime.toFixed(2)}ms (${(computedTime/fullBrowserTime*100).toFixed(1)}%)`);
    console.log(`  String parsing:   ${parseTime.toFixed(2)}ms (${(parseTime/fullBrowserTime*100).toFixed(1)}%)`);
    console.log(`  Pure math:        ${mathTime.toFixed(2)}ms (${(mathTime/fullBrowserTime*100).toFixed(1)}%)`);
    console.log(`  Full browser:     ${fullBrowserTime.toFixed(2)}ms (100.0%)`);
    
    const speedup = fullBrowserTime / mathTime;
    console.log(`\n🚀 Custom method is ${speedup.toFixed(1)}x faster`);
    
    console.log("\n💡 Why the huge difference:");
    console.log("  • DOM operations are expensive (style recalculation)");
    console.log("  • getComputedStyle() forces layout computations");
    console.log("  • String parsing adds overhead");
    console.log("  • Browser has to handle CSS edge cases");
    console.log("  • Your math is optimized for this specific task");
    
    // Cleanup
    document.body.removeChild(testSpan);
}
