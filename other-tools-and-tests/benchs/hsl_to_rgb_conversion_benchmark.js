{
    // HSL to RGB Conversion Benchmark
    // Compares custom hslToRgb method vs browser's native conversion using computed styles

    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    function getRandomFloat() {
        return Math.random();
    }

    // Create a single span element for reuse in browser conversion tests
    const testSpan = document.createElement('span');
    document.body.appendChild(testSpan);

    // Browser-based HSL to RGB conversion using computed styles
    function browserHslToRgb(h, s, l) {
        // Convert to CSS hsl format (h: 0-360, s: 0-100%, l: 0-100%)
        const hDeg = Math.round(h * 360);
        const sPercent = Math.round(s * 100);
        const lPercent = Math.round(l * 100);
        
        // Set the HSL color on the span
        testSpan.style.color = `hsl(${hDeg}, ${sPercent}%, ${lPercent}%)`;
        
        // Get computed RGB value
        const computedColor = getComputedStyle(testSpan).color;
        
        // Parse the rgb(r, g, b) string
        const match = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        }
        return [0, 0, 0]; // fallback
    }

    // Benchmark function for custom hslToRgb method
    function benchmarkCustomHslToRgb(iterations = 100000) {
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            const h = getRandomFloat(); // 0-1
            const s = getRandomFloat(); // 0-1  
            const l = getRandomFloat(); // 0-1
            uDark.hslToRgb(h, s, l);
        }
        
        const end = performance.now();
        return end - start;
    }

    // Benchmark function for browser-based conversion
    function benchmarkBrowserHslToRgb(iterations = 100000) {
        const start = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            const h = getRandomFloat(); // 0-1
            const s = getRandomFloat(); // 0-1
            const l = getRandomFloat(); // 0-1
            browserHslToRgb(h, s, l);
        }
        
        const end = performance.now();
        return end - start;
    }

    // Accuracy test - compare results between both methods
    function accuracyTest(numTests = 1000) {
        let maxDifference = 0;
        let avgDifference = 0;
        let totalDifference = 0;
        let matches = 0;

        console.log("\n=== Accuracy Test ===");
        console.log("Comparing custom hslToRgb vs browser conversion...");

        for (let i = 0; i < numTests; i++) {
            const h = getRandomFloat();
            const s = getRandomFloat();
            const l = getRandomFloat();

            const [customR, customG, customB] = uDark.hslToRgb(h, s, l);
            const [browserR, browserG, browserB] = browserHslToRgb(h, s, l);

            const rDiff = Math.abs(customR - browserR);
            const gDiff = Math.abs(customG - browserG);
            const bDiff = Math.abs(customB - browserB);
            
            const totalDiff = rDiff + gDiff + bDiff;
            totalDifference += totalDiff;
            maxDifference = Math.max(maxDifference, totalDiff);

            if (totalDiff === 0) {
                matches++;
            }

            // Log a few examples for debugging
            if (i < 5) {
                console.log(`Test ${i + 1}: HSL(${h.toFixed(3)}, ${s.toFixed(3)}, ${l.toFixed(3)})`);
                console.log(`  Custom:  RGB(${customR}, ${customG}, ${customB})`);
                console.log(`  Browser: RGB(${browserR}, ${browserG}, ${browserB})`);
                console.log(`  Diff:    (${rDiff}, ${gDiff}, ${bDiff}) = ${totalDiff}`);
            }
        }

        avgDifference = totalDifference / numTests;
        const exactMatches = (matches / numTests) * 100;

        console.log(`\nAccuracy Results (${numTests} tests):`);
        console.log(`  Exact matches: ${matches}/${numTests} (${exactMatches.toFixed(1)}%)`);
        console.log(`  Average total difference: ${avgDifference.toFixed(2)}`);
        console.log(`  Maximum total difference: ${maxDifference}`);
        
        return { exactMatches, avgDifference, maxDifference };
    }

    // Performance test with different iteration counts
    function performanceTest() {
        console.log("\n=== Performance Test ===");
        
        const testSizes = [10000, 50000, 100000];
        
        for (const iterations of testSizes) {
            console.log(`\nTesting with ${iterations.toLocaleString()} iterations:`);
            
            // Test custom method
            const customTime = benchmarkCustomHslToRgb(iterations);
            console.log(`  Custom hslToRgb: ${customTime.toFixed(2)}ms`);
            
            // Test browser method
            const browserTime = benchmarkBrowserHslToRgb(iterations);
            console.log(`  Browser conversion: ${browserTime.toFixed(2)}ms`);
            
            // Calculate performance difference
            const faster = customTime < browserTime ? 'Custom' : 'Browser';
            const slower = customTime < browserTime ? 'Browser' : 'Custom';
            const fasterTime = Math.min(customTime, browserTime);
            const slowerTime = Math.max(customTime, browserTime);
            const speedupRatio = slowerTime / fasterTime;
            const percentageFaster = ((slowerTime - fasterTime) / slowerTime) * 100;
            
            console.log(`  ${faster} method is ${speedupRatio.toFixed(2)}x faster`);
            console.log(`  ${slower} method is ${percentageFaster.toFixed(1)}% slower`);
            console.log(`  Ops/sec - Custom: ${(iterations / customTime * 1000).toLocaleString()} | Browser: ${(iterations / browserTime * 1000).toLocaleString()}`);
        }
    }

    // Memory usage test
    function memoryTest() {
        console.log("\n=== Memory Usage Test ===");
        
        if (performance.memory) {
            const initialMemory = performance.memory.usedJSHeapSize;
            
            // Test custom method memory usage
            const customStartMemory = performance.memory.usedJSHeapSize;
            benchmarkCustomHslToRgb(50000);
            const customEndMemory = performance.memory.usedJSHeapSize;
            const customMemoryUsed = customEndMemory - customStartMemory;
            
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
            
            // Test browser method memory usage  
            const browserStartMemory = performance.memory.usedJSHeapSize;
            benchmarkBrowserHslToRgb(50000);
            const browserEndMemory = performance.memory.usedJSHeapSize;
            const browserMemoryUsed = browserEndMemory - browserStartMemory;
            
            console.log(`  Custom method memory delta: ${(customMemoryUsed / 1024).toFixed(2)} KB`);
            console.log(`  Browser method memory delta: ${(browserMemoryUsed / 1024).toFixed(2)} KB`);
        } else {
            console.log("  Memory API not available in this browser");
        }
    }

    // Edge cases test
    function edgeCasesTest() {
        console.log("\n=== Edge Cases Test ===");
        
        const edgeCases = [
            [0, 0, 0],      // Black
            [0, 0, 1],      // White  
            [0, 0, 0.5],    // Gray
            [0, 1, 0.5],    // Red
            [1/3, 1, 0.5],  // Green
            [2/3, 1, 0.5],  // Blue
            [0.5, 1, 0.5],  // Cyan
            [1/6, 1, 0.5],  // Yellow
            [5/6, 1, 0.5],  // Magenta
        ];

        edgeCases.forEach(([h, s, l], index) => {
            const [customR, customG, customB] = uDark.hslToRgb(h, s, l);
            const [browserR, browserG, browserB] = browserHslToRgb(h, s, l);
            
            const rDiff = Math.abs(customR - browserR);
            const gDiff = Math.abs(customG - browserG); 
            const bDiff = Math.abs(customB - browserB);
            const totalDiff = rDiff + gDiff + bDiff;
            
            console.log(`  Case ${index + 1}: HSL(${h}, ${s}, ${l})`);
            console.log(`    Custom:  RGB(${customR}, ${customG}, ${customB})`);
            console.log(`    Browser: RGB(${browserR}, ${browserG}, ${browserB})`);
            console.log(`    Diff: ${totalDiff} ${totalDiff === 0 ? '✓' : '✗'}`);
        });
    }

    // Run all tests
    function runAllTests() {
        console.log("🚀 HSL to RGB Conversion Benchmark");
        console.log("==================================");
        
        // Run accuracy test first
        accuracyTest(1000);
        
        // Run performance tests
        performanceTest();
        
        // Run memory test
        memoryTest();
        
        // Run edge cases test
        edgeCasesTest();
        
        // Cleanup
        document.body.removeChild(testSpan);
        
        console.log("\n✅ All tests completed!");
    }

    // Auto-run tests
    runAllTests();
}
