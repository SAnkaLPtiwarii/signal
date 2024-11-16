// src/types/index.ts
export interface SignalData {
    time: number;
    original: number;
    bandpass: number;
    lowpass: number;
    highpass: number;
    instantFreq: number;
    amplitude: number;
}

export interface FilterParameters {
    bandpass: {
        low: number;
        high: number;
    };
    lowpass: {
        cutoff: number;
    };
    highpass: {
        cutoff: number;
    };
}

export interface SNRValues {
    bandpass: number;
    lowpass: number;
    highpass: number;
}