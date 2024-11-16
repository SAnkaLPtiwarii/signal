// src/components/types/types.ts

// Signal Data Types
export interface SignalDataPoint {
    time: number;
    original: number;
    filtered: number;
    instantFreq: number;
    amplitude: number;
}

export interface FilterParams {
    bandpass: {
        low: number;
        high: number;
    };
}

export interface Metrics {
    snr: number;
    quality: number;
    frequency: number;
}

// Complex Number Type for FFT
export interface ComplexNumber {
    real: number;
    imag: number;
}

// Filter Coefficients Type
export interface FilterCoefficients {
    b: number[];
    a: number[];
}

// FFT Result Type
export interface FFTResult {
    frequencies: number[];
    magnitudes: number[];
    phases: number[];
}

// Window Function Types
export type WindowFunction = 'hanning' | 'hamming' | 'blackman' | 'rectangular';

// Processing Configuration
export interface ProcessingConfig {
    sampleRate: number;
    windowSize: number;
    windowType: WindowFunction;
}

export interface FilterConfig {
    type: 'lowpass' | 'highpass' | 'bandpass';
    cutoffFreq: number | [number, number];
    order?: number;
}