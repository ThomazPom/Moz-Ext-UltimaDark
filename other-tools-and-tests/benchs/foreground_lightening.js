function benchmark() {
    let iterations = 1000000;  // 10 million iterations
    let A, B, l;

    // Array of anonymous functions representing the code snippets
    const codeSnippets = [
        {
            name: "First Code",
            func: () => {
                l = Math.random();  // Generate random number between 0 and 1
                A = Math.random();  // Generate random A between 0 and 1
                B = Math.random();  // Generate random B between 0 and 1
                l = l < 0.5
                    ? 2 * l * (A - B) + B
                    : 2 * l * (B - A) + (2 * A - B);
            }
        },
        {
            name: "Second Code",
            func: () => {
                l = Math.random();  // Generate random number between 0 and 1
                A = Math.random();  // Generate random A between 0 and 1
                B = Math.random();  // Generate random B between 0 and 1
                l = Math.min(2 * l, -2 * l + 2) * (A - B) + B;
            }
        }
        // You can add more code snippets here.
    ];

    // Array to store the benchmarking times
    let times = [];

    // Loop through each code snippet and benchmark it
    codeSnippets.forEach((snippet) => {
        console.log(`${snippet.name}:`,snippet.func.toString());
        console.time(snippet.name);
        let start = performance.now();
        for (let i = 0; i < iterations; i++) {
            snippet.func();  // Execute the anonymous function
        }
        let end = performance.now();
        let timeTaken = end - start;
        console.timeEnd(snippet.name);

        // Store the time taken for this snippet
        times.push({
            name: snippet.name,
            time: timeTaken
        });

        console.log(`Time taken by ${snippet.name}: ${timeTaken.toFixed(2)} ms`);
    });

    // Sort times array based on performance (ascending order)
    times.sort((a, b) => a.time - b.time);

    // Display the sorted order and comparison with the fastest one
    console.log("\nPerformance Comparison (Fastest to Slowest):");
    const fastestTime = times[0].time; // Time of the fastest code
    times.forEach((snippet, index) => {
        let diff = snippet.time - fastestTime;
        let percentageDiff = (diff / fastestTime) * 100;
        console.log(`${index + 1}. ${snippet.name} - ${snippet.time.toFixed(2)} ms (${percentageDiff.toFixed(2)}% slower than the fastest)`);
    });

    // Show which one is the fastest
    console.log(`\n${times[0].name} is the fastest, taking ${fastestTime.toFixed(2)} ms`);
}

benchmark();
