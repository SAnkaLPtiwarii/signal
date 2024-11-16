// src/types/types.ts

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
    b: number[];  // numerator coefficients
    a: number[];  // denominator coefficients
}

// Signal Processing Types
export interface ProcessedSignal {
    time: number[];
    original: number[];
    filtered: number[];
    frequency: number[];
    amplitude: number[];
}

// Chart Data Types
export interface ChartDataPoint {
    frequency: number;
    magnitude: number;
    phase?: number;
}

// Filter Response Types
export interface FilterResponse {
    frequency: number;
    response: number;
    phase?: number;
}

// Analysis Results
export interface SignalAnalysis {
    peakFrequency: number;
    rms: number;
    snr: number;
    thd: number;  // Total Harmonic Distortion
}

// FFT Result Type
export interface FFTResult {
    frequencies: number[];
    magnitudes: number[];
    phases: number[];
}

// Window Function Types
export type WindowFunction = 'hanning' | 'hamming' | 'blackman' | 'rectangular';

// Configuration Types
export interface ProcessingConfig {
    sampleRate: number;
    windowSize: number;
    overlap: number;
    windowType: WindowFunction;
}

export interface FilterConfig {
    type: 'lowpass' | 'highpass' | 'bandpass' | 'bandstop';
    order: number;
    cutoffFreq: number | [number, number];  // single number for LP/HP, pair for BP/BS
}