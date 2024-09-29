function generateRandomString(minLen = 5000, maxLen = 1000) {
    const length = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function generateRandomValues(numValues = 100) {
    let values = [];
    for (let i = 0; i < numValues; i++) {
        values.push(Math.random()); // Random float between 0 and 1
    }
    return values;
}

// Existing cache system using fMurmurHash3Hash function
function benchmarkExistingCache(strings, values, numTests = 100) {
    let cache = {}; // Simulating the cache as an object
    let totalTime = 0;

    for (let i = 0; i < numTests; i++) {
        let key = strings[i];
        let value = values[i];

        // Measure insertion time (hashing + storing)
        const startInsert = performance.now();
        const hashKey = fMurmurHash3Hash(key);
        cache[hashKey] = value;
        const endInsert = performance.now();

        totalTime += (endInsert - startInsert);

        // Measure retrieval time
        const startRetrieve = performance.now();
        const retrievedValue = cache[hashKey];
        const endRetrieve = performance.now();

        totalTime += (endRetrieve - startRetrieve);
    }

    const avgTime = totalTime / numTests;
    console.log(`Existing Cache - Avg time for ${numTests} executions: ${avgTime.toFixed(2)} ms`);
    console.log(`Existing Cache - Total time for ${numTests} executions: ${totalTime.toFixed(2)} ms`);
}

// New cache system using Map with no explicit hashing
function benchmarkNewCache(strings, values, numTests = 100) {
    let map = new Map();
    let totalTime = 0;

    for (let i = 0; i < numTests; i++) {
        let key = strings[i];
        let value = values[i];

        // Measure insertion time (storing in Map)
        const startInsert = performance.now();
        map.set(key, value);
        const endInsert = performance.now();

        totalTime += (endInsert - startInsert);

        // Measure retrieval time
        const startRetrieve = performance.now();
        const retrievedValue = map.get(key);
        const endRetrieve = performance.now();

        totalTime += (endRetrieve - startRetrieve);
    }

    const avgTime = totalTime / numTests;
    console.log(`New Cache (Map) - Avg time for ${numTests} executions: ${avgTime.toFixed(2)} ms`);
    console.log(`New Cache (Map) - Total time for ${numTests} executions: ${totalTime.toFixed(2)} ms`);
}

// Pre-initialize random strings and values
const numTests = 10000;
const randomStrings = Array.from({ length: numTests }, () => generateRandomString());
const randomValues = generateRandomValues(numTests);

// Run the benchmarks
console.log("Benchmarking Existing Cache with Hashing Function:");
benchmarkExistingCache(randomStrings, randomValues, numTests);

console.log("\nBenchmarking New Cache with Map:");
benchmarkNewCache(randomStrings, randomValues, numTests);
