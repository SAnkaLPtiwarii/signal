export interface SignalDataPoint {
    time: number;
    original: number;
    filtered: number;
    instantFreq: number;
    amplitude: number;
}

export const generateSignalData = (
    duration: number = 1,
    sampleRate: number = 1000,
    mainFreq: number = 10.5,
    noiseLevel: number = 1.5
): SignalDataPoint[] => {
    const data: SignalDataPoint[] = [];
    const dt = 1 / sampleRate;

    for (let t = 0; t <= duration; t += dt) {
        // Main signal
        const mainSignal = 5 * Math.sin(2 * Math.PI * mainFreq * t);

        // Noise components
        const highFreqNoise = 2 * Math.sin(2 * Math.PI * 30 * t);
        const randomNoise = (Math.random() - 0.5) * noiseLevel;
        const lowFreqDrift = Math.sin(2 * Math.PI * 0.5 * t);

        // Combined signal
        const original = mainSignal + highFreqNoise + randomNoise + lowFreqDrift;

        // Instantaneous frequency and amplitude
        const instantFreq = mainFreq + Math.sin(2 * Math.PI * t);
        const amplitude = Math.abs(mainSignal);

        data.push({
            time: t,
            original,
            filtered: mainSignal,
            instantFreq,
            amplitude
        });
    }

    return data;
};