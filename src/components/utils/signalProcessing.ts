export interface SignalData {
    time: number;
    original: number;
    filtered: number;
    bandpass: number;
    lowpass: number;
    highpass: number;
    instantFreq?: number;
    phase?: number;
}

interface ComplexNumber {
    real: number;
    imag: number;
}

interface ButterworthCoefficients {
    b: number[];
    a: number[];
}

// Improved Butterworth filter design
function designButterworthFilter(cutoffFreq: number, sampleRate: number, order: number = 4): ButterworthCoefficients {
    const nyquist = sampleRate / 2;
    const normalizedCutoff = cutoffFreq / nyquist;
    const wc = Math.tan(Math.PI * normalizedCutoff / 2);

    // Pre-warp frequency for bilinear transform
    const coefficients: ButterworthCoefficients = { b: [], a: [] };

    // Calculate poles for analog filter
    for (let k = 0; k < order; k++) {
        const theta = Math.PI * (2 * k + 1) / (2 * order);
        const pole = {
            real: -wc * Math.cos(theta),
            imag: wc * Math.sin(theta)
        };

        // Bilinear transform
        const denominator = Math.pow(1 - pole.real, 2) + Math.pow(pole.imag, 2);
        coefficients.b.push((1 + pole.real) / denominator);
        coefficients.a.push(1);
        coefficients.a.push(-2 * pole.real / denominator);
        coefficients.a.push((Math.pow(pole.real, 2) + Math.pow(pole.imag, 2)) / denominator);
    }

    return coefficients;
}

// Apply filter with given coefficients
function applyFilter(data: number[], coeffs: ButterworthCoefficients): number[] {
    const { b, a } = coeffs;
    const output: number[] = new Array(data.length).fill(0);


    for (let i = 0; i < data.length; i++) {
        let sum = 0;
        // Apply feedforward coefficients
        for (let j = 0; j < b.length; j++) {
            if (i - j >= 0) {
                sum += b[j] * data[i - j];
            }
        }
        // Apply feedback coefficients
        for (let j = 1; j < a.length; j++) {
            if (i - j >= 0) {
                sum -= a[j] * output[i - j];
            }
        }
        output[i] = sum / a[0];
    }

    return output;
}

export function processSignal(rawData: number[], sampleRate: number = 1000): SignalData[] {
    const times = rawData.map((_, i) => i / sampleRate);

    // Calculate instantaneous frequency using Hilbert transform
    function calculateInstantFreq(data: number[]): number[] {
        const N = data.length;
        const hilbert: ComplexNumber[] = new Array(N);

        // Compute analytic signal
        for (let i = 0; i < N; i++) {
            hilbert[i] = {
                real: data[i],
                imag: 0
            };

            // Apply Hilbert transform
            for (let j = 0; j < N; j++) {
                if (i !== j) {
                    hilbert[i].imag += data[j] / Math.PI / (i - j);
                }
            }
        }

        // Calculate instantaneous frequency
        return hilbert.map((h, i) => {
            if (i === 0) return 0;
            const phase = Math.atan2(h.imag, h.real);
            const prevPhase = Math.atan2(hilbert[i - 1].imag, hilbert[i - 1].real);
            let dPhase = phase - prevPhase;
            // Unwrap phase
            if (dPhase > Math.PI) dPhase -= 2 * Math.PI;
            if (dPhase < -Math.PI) dPhase += 2 * Math.PI;
            return (dPhase * sampleRate) / (2 * Math.PI);
        });
    }

    const instantFreqs = calculateInstantFreq(rawData);

    return times.map((time, i) => ({
        time,
        original: rawData[i],
        filtered: rawData[i], // Will be updated by filters
        bandpass: rawData[i],
        lowpass: rawData[i],
        highpass: rawData[i],
        instantFreq: instantFreqs[i],
        phase: Math.atan2(instantFreqs[i], rawData[i])
    }));
}

export function applyBandpassFilter(
    data: number[],
    lowCutoff: number,
    highCutoff: number,
    sampleRate: number,
    order: number = 4
): number[] {
    // Create bandpass by cascading highpass and lowpass
    const highpassCoeffs = designButterworthFilter(lowCutoff, sampleRate, order);
    const lowpassCoeffs = designButterworthFilter(highCutoff, sampleRate, order);

    const highpassed = applyFilter(data, highpassCoeffs);
    return applyFilter(highpassed, lowpassCoeffs);
}

export function applyLowpassFilter(
    data: number[],
    cutoff: number,
    sampleRate: number,
    order: number = 4
): number[] {
    const coeffs = designButterworthFilter(cutoff, sampleRate, order);
    return applyFilter(data, coeffs);
}

export function applyHighpassFilter(
    data: number[],
    cutoff: number,
    sampleRate: number,
    order: number = 4
): number[] {
    const coeffs = designButterworthFilter(cutoff, sampleRate, order);
    const lowpass = applyFilter(data, coeffs);
    return data.map((value, i) => value - lowpass[i]);
}

// Add utility functions for signal analysis
export function calculateSNR(signal: number[], noise: number[]): number {
    const signalPower = signal.reduce((acc, val) => acc + val * val, 0) / signal.length;
    const noisePower = noise.reduce((acc, val) => acc + val * val, 0) / noise.length;
    return 10 * Math.log10(signalPower / noisePower);
}

export function calculateRMS(signal: number[]): number {
    return Math.sqrt(signal.reduce((acc, val) => acc + val * val, 0) / signal.length);
}

export function calculatePeakFrequency(data: number[], sampleRate: number): number {
    const N = data.length;
    const frequencies = Array.from({ length: N / 2 }, (_, i) => i * sampleRate / N);

    // Calculate FFT
    const fft = calculateFFT(data);

    // Find peak frequency
    let maxMagnitude = 0;
    let peakFreq = 0;

    for (let i = 0; i < N / 2; i++) {
        const magnitude = Math.sqrt(fft[i].real * fft[i].real + fft[i].imag * fft[i].imag);
        if (magnitude > maxMagnitude) {
            maxMagnitude = magnitude;
            peakFreq = frequencies[i];
        }
    }

    return peakFreq;
}

function calculateFFT(data: number[]): ComplexNumber[] {
    const N = data.length;
    if (N <= 1) return data.map(x => ({ real: x, imag: 0 }));

    const even = calculateFFT(data.filter((_, i) => i % 2 === 0));
    const odd = calculateFFT(data.filter((_, i) => i % 2 === 1));

    return Array.from({ length: N }, (_, k) => {
        const angle = -2 * Math.PI * k / N;
        const t = {
            real: Math.cos(angle),
            imag: Math.sin(angle)
        };
        const oddK = odd[k % (N / 2)];
        const wOddK = {
            real: t.real * oddK.real - t.imag * oddK.imag,
            imag: t.real * oddK.imag + t.imag * oddK.real
        };
        const evenK = even[k % (N / 2)];
        return {
            real: evenK.real + wOddK.real,
            imag: evenK.imag + wOddK.imag
        };
    });
}