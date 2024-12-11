import { scipyIfft } from './fft';

// Complex number operations
const complex = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    mult: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
    div: (a, b) => {
        const denom = b[0] * b[0] + b[1] * b[1];
        return [(a[0] * b[0] + a[1] * b[1]) / denom, (a[1] * b[0] - a[0] * b[1]) / denom];
    }
};

// Custom IFFT implementation
export function ifft(real, imag) {
    const n = real.length;
    if (n <= 1) return [[real[0], imag[0]]];

    const output = new Array(n);

    // Bit reversal
    for (let i = 0; i < n; i++) {
        output[i] = [real[i] || 0, imag[i] || 0];
    }
    for (let i = 0, j = 0; i < n; i++) {
        if (i > j) {
            [output[i], output[j]] = [output[j], output[i]];
        }
        let m = n >> 1;
        while (m >= 1 && j & m) {
            j ^= m;
            m >>= 1;
        }
        j ^= m;
    }

    // Cooley-Tukey IFFT
    for (let s = 1; s < n; s <<= 1) {
        const m = s << 1;
        const wm = [Math.cos(2 * Math.PI / m), Math.sin(2 * Math.PI / m)];
        for (let k = 0; k < n; k += m) {
            let w = [1, 0];
            for (let j = 0; j < s; j++) {
                if (k + j + s < n) {
                    const t = complex.mult(w, output[k + j + s]);
                    output[k + j + s] = complex.sub(output[k + j], t);
                    output[k + j] = complex.add(output[k + j], t);
                    w = complex.mult(w, wm);
                }
            }
        }
    }

    // Scale the output
    for (let i = 0; i < n; i++) {
        output[i] = complex.div(output[i], [n, 0]);
    }

    return output;
}


export function ifftPath(connectedPath) {
    // Convert path points to omplex numbers

    const frequencies = scipyIfft(
        connectedPath.map(p => p.x), 
        connectedPath.map(p => p.y)
    );
    return frequencies;
}

// Generate circle centers
export function generateCircleCenters(frequencies, i) {
    const N = frequencies.length;

    let x = 0;
    let y = 0;
    let j = 0;
    let centers = [];
    while (j < N) {
        const angle = -2 * Math.PI * i * j / N;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        x += frequencies[j][0] * cos - frequencies[j][1] * sin;
        y += frequencies[j][0] * sin + frequencies[j][1] * cos;
        centers.push([x, y]);
        
        j++
    }

    return centers;
}


