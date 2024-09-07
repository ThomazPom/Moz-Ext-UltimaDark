{

    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }
    
    function benchmark(render) {
        const start = performance.now();
        for (let i = 0; i < 500000; i++) {
            const r = getRandomInt(256); // Random value between 0 and 255
            const g = getRandomInt(256);
            const b = getRandomInt(256);
            uDark.rgba(r, g, b, 1, render); // Call with random RGB values
        }
        const end = performance.now();
        return end - start; // Return the time in milliseconds
    }
    
    // Running benchmarks for uDark.rgba_val
    const timeRgba = benchmark(uDark.rgba_val);
    console.log(`Benchmark for uDark.rgba_val: ${timeRgba.toFixed(2)}ms`);
    
    // Running benchmarks for uDark.hsla_val
    const timeHsla = benchmark(uDark.hsla_val);
    console.log(`Benchmark for uDark.hsla_val: ${timeHsla.toFixed(2)}ms`);
    
    // Ensure both times are valid and determine the faster one
    if (typeof timeRgba === 'number' && typeof timeHsla === 'number') {
        let faster, slower, renderFaster, renderSlower;
        
        if (timeRgba < timeHsla) {
            faster = timeRgba;
            slower = timeHsla;
            renderFaster = 'uDark.rgba_val';
            renderSlower = 'uDark.hsla_val';
        } else {
            faster = timeHsla;
            slower = timeRgba;
            renderFaster = 'uDark.hsla_val';
            renderSlower = 'uDark.rgba_val';
        }
    
        // Calculate the percentage of slowness
        const percentageSlowness = ((slower - faster) / faster) * 100;
    
        console.log(`${renderSlower} is slower by ${percentageSlowness.toFixed(2)}% compared to ${renderFaster}.`);
    } else {
        console.error("Timing values are not valid.");
    }
    
}