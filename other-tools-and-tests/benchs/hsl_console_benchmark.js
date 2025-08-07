// Quick HSL to RGB Benchmark - Console Version
// Copy and paste this entire code into your browser console on any page where uDark is loaded

(function() {
    'use strict';
    
    console.log('🚀 HSL to RGB Conversion Benchmark (Console Version)');
    console.log('====================================================');
    
    // Check if uDark is available
    if (typeof uDark === 'undefined') {
        console.error('❌ uDark is not available. Please run this on a page with your extension loaded.');
        return;
    }
    
    // Create test element
    const testSpan = document.createElement('span');
    testSpan.style.position = 'absolute';
    testSpan.style.visibility = 'hidden';
    document.body.appendChild(testSpan);
    
    // Browser-based HSL to RGB conversion
    function browserHslToRgb(h, s, l) {
        const hDeg = Math.round(h * 360);
        const sPercent = Math.round(s * 100);
        const lPercent = Math.round(l * 100);
        
        testSpan.style.color = `hsl(${hDeg}, ${sPercent}%, ${lPercent}%)`;
        const computedColor = getComputedStyle(testSpan).color;
        
        const match = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        }
        return [0, 0, 0];
    }
    
    // Quick accuracy test
    function quickAccuracyTest(numTests = 100) {
        console.log('\n📊 Quick Accuracy Test');
        console.log('-'.repeat(25));
        
        let matches = 0;
        let totalDiff = 0;
        let maxDiff = 0;
        
        for (let i = 0; i < numTests; i++) {
            const h = Math.random();
            const s = Math.random();
            const l = Math.random();
            
            const [customR, customG, customB] = uDark.hslToRgb(h, s, l);
            const [browserR, browserG, browserB] = browserHslToRgb(h, s, l);
            
            const diff = Math.abs(customR - browserR) + Math.abs(customG - browserG) + Math.abs(customB - browserB);
            totalDiff += diff;
            maxDiff = Math.max(maxDiff, diff);
            
            if (diff === 0) matches++;
            
            // Show first few examples
            if (i < 3) {
                console.log(`Example ${i + 1}: HSL(${h.toFixed(3)}, ${s.toFixed(3)}, ${l.toFixed(3)})`);
                console.log(`  Custom:  RGB(${customR}, ${customG}, ${customB})`);
                console.log(`  Browser: RGB(${browserR}, ${browserG}, ${browserB})`);
                console.log(`  Diff: ${diff} ${diff === 0 ? '✅' : '⚠️'}`);
            }
        }
        
        const exactMatchPercent = (matches / numTests) * 100;
        const avgDiff = totalDiff / numTests;
        
        console.log(`\n📈 Results (${numTests} tests):`);
        console.log(`  Exact matches: ${matches}/${numTests} (${exactMatchPercent.toFixed(1)}%)`);
        console.log(`  Average difference: ${avgDiff.toFixed(2)}`);
        console.log(`  Maximum difference: ${maxDiff}`);
    }
    
    // Quick performance test
    function quickPerformanceTest() {
        console.log('\n⚡ Performance Test');
        console.log('-'.repeat(20));
        
        const iterations = 50000;
        
        // Test custom method
        console.log(`Testing ${iterations.toLocaleString()} iterations...`);
        
        const customStart = performance.now();
        for (let i = 0; i < iterations; i++) {
            const h = Math.random();
            const s = Math.random();
            const l = Math.random();
            uDark.hslToRgb(h, s, l);
        }
        const customTime = performance.now() - customStart;
        
        // Test browser method
        const browserStart = performance.now();
        for (let i = 0; i < iterations; i++) {
            const h = Math.random();
            const s = Math.random();
            const l = Math.random();
            browserHslToRgb(h, s, l);
        }
        const browserTime = performance.now() - browserStart;
        
        // Results
        const customOpsPerSec = (iterations / customTime * 1000).toLocaleString();
        const browserOpsPerSec = (iterations / browserTime * 1000).toLocaleString();
        
        console.log(`⚙️  Custom method:  ${customTime.toFixed(2)}ms  (${customOpsPerSec} ops/sec)`);
        console.log(`🌐 Browser method: ${browserTime.toFixed(2)}ms  (${browserOpsPerSec} ops/sec)`);
        
        if (customTime < browserTime) {
            const speedup = (browserTime / customTime).toFixed(2);
            const percent = ((browserTime - customTime) / browserTime * 100).toFixed(1);
            console.log(`🏆 Custom method is ${speedup}x faster (${percent}% improvement)`);
        } else {
            const speedup = (customTime / browserTime).toFixed(2);
            const percent = ((customTime - browserTime) / customTime * 100).toFixed(1);
            console.log(`🏆 Browser method is ${speedup}x faster (${percent}% improvement)`);
        }
    }
    
    // Test edge cases
    function testEdgeCases() {
        console.log('\n🔍 Edge Cases Test');
        console.log('-'.repeat(20));
        
        const cases = [
            { name: 'Black', hsl: [0, 0, 0] },
            { name: 'White', hsl: [0, 0, 1] },
            { name: 'Red', hsl: [0, 1, 0.5] },
            { name: 'Green', hsl: [1/3, 1, 0.5] },
            { name: 'Blue', hsl: [2/3, 1, 0.5] },
            { name: 'Gray', hsl: [0, 0, 0.5] }
        ];
        
        cases.forEach(({ name, hsl: [h, s, l] }) => {
            const [customR, customG, customB] = uDark.hslToRgb(h, s, l);
            const [browserR, browserG, browserB] = browserHslToRgb(h, s, l);
            
            const diff = Math.abs(customR - browserR) + Math.abs(customG - browserG) + Math.abs(customB - browserB);
            
            console.log(`${name}: Custom(${customR},${customG},${customB}) vs Browser(${browserR},${browserG},${browserB}) - Diff: ${diff} ${diff === 0 ? '✅' : '⚠️'}`);
        });
    }
    
    // Run all tests
    try {
        quickAccuracyTest(100);
        quickPerformanceTest();
        testEdgeCases();
        
        console.log('\n✅ Benchmark completed successfully!');
        console.log('\n💡 Tips:');
        console.log('   • Values within 1-2 difference are typically imperceptible');
        console.log('   • Custom method should be significantly faster');
        console.log('   • For production use, accuracy vs speed trade-offs matter');
        
    } catch (error) {
        console.error('❌ Benchmark failed:', error);
    } finally {
        // Cleanup
        if (testSpan.parentNode) {
            document.body.removeChild(testSpan);
        }
    }
})();
