function generateRandomString(minLen = 1000, maxLen = 2000) {
    const length = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function benchmark_fMurmurHash3Hash(numTests = 100) {
    let totalTime = 0;

    for (let i = 0; i < numTests; i++) {
        // Generate a random string of 1000-2000 characters
        const randomString = generateRandomString();

        // Start the timer
        const startTime = performance.now();

        // Execute the hashing function
        const result = fMurmurHash3Hash(randomString);

        // Stop the timer
        const endTime = performance.now();

        // Calculate the time taken for this iteration in milliseconds
        const timeTaken = endTime - startTime;

        totalTime += timeTaken;
    }

    // Calculate the average time
    const avgTime = totalTime / numTests;

    console.log(`Avg time for ${numTests} executions: ${avgTime.toFixed(2)} ms`);
    console.log(`Total time for ${numTests} executions: ${totalTime.toFixed(2)} ms`);
}

// Assuming fMurmurHash3Hash is already defined in your scope, run the benchmark
benchmark_fMurmurHash3Hash(1000);
