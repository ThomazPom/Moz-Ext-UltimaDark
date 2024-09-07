function versionCode1(l, A, B) {
    return Math.min(2 * A * l, A + 2 * (B - A) * (l - 0.5));
}

function versionCode2(l, A, B) {
    if (l < 0.5) {
        return 2 * A * l;
    } else {
        return A + 2 * (B - A) * (l - 0.5);
    }
}

function versionCode3(l, A, B) {
    return (l < 0.5) ? (2 * A * l) : (A + 2 * (B - A) * (l - 0.5));
}

function benchmark(func, iterations, A, B) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        const l = Math.random();
        func(l, A, B);
    }
    const end = performance.now();
    return end - start;
}

const A = 0.4;
const B = 0.1;
const iterations = 10000000;

const time1 = benchmark(versionCode1, iterations, A, B);
console.log(`Version Code 1 took ${time1.toFixed(2)} ms`);

const time2 = benchmark(versionCode2, iterations, A, B);
console.log(`Version Code 2 took ${time2.toFixed(2)} ms`);

const time3 = benchmark(versionCode3, iterations, A, B);
console.log(`Version Code 3 took ${time3.toFixed(2)} ms`);

const percentageSlowV1 = ((time1 - time2) / time2) * 100;
const percentageSlowV3 = ((time3 - time2) / time2) * 100;

console.log(`Version Code 1 is ${percentageSlowV1.toFixed(2)}% slower than Version Code 2`);
console.log(`Version Code 3 is ${percentageSlowV3.toFixed(2)}% slower than Version Code 2`);
