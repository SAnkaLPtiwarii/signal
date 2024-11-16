import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { type SignalDataPoint } from './utils/dataGenerators';

const SAMPLE_RATE = 1000;
const MIN_BUFFER_SIZE = 512;

interface FilterParams {
    bandpass: {
        low: number;
        high: number;
    };
}

const FFT: React.FC<{
    data: SignalDataPoint[];
    filterParams: FilterParams;
}> = ({ data, filterParams }) => {
    const [fftData, setFftData] = useState<Array<{ frequency: number; magnitude: number }>>([]);

    const calculateFFT = useCallback(() => {
        if (data.length < MIN_BUFFER_SIZE) return [];

        // Use a power of 2 for buffer size
        const bufferSize = Math.pow(2, Math.floor(Math.log2(data.length)));

        // Hanning window
        const window = Array(bufferSize).fill(0).map((_, i) =>
            0.5 * (1 - Math.cos(2 * Math.PI * i / (bufferSize - 1)))
        );

        // Extract signal and apply window
        const signal = data.slice(0, bufferSize).map((point, i) => {
            const freq = 1 / (2 * Math.PI * point.time);
            const isInPassband = freq >= filterParams.bandpass.low &&
                freq <= filterParams.bandpass.high;
            return (isInPassband ? 0 : point.original) * window[i];
        });

        // Calculate frequency spectrum
        const spectrum = Array(bufferSize / 2).fill(0).map((_, k) => {
            const freq = (k * SAMPLE_RATE) / bufferSize;
            if (freq > 30) return { frequency: freq, magnitude: 0 }; // Limit to 30Hz

            let real = 0, imag = 0;
            for (let n = 0; n < bufferSize; n++) {
                const angle = -2 * Math.PI * k * n / bufferSize;
                real += signal[n] * Math.cos(angle);
                imag += signal[n] * Math.sin(angle);
            }

            const magnitude = Math.sqrt(real * real + imag * imag) / bufferSize;
            return { frequency: freq, magnitude };
        }).filter(point => point.frequency <= 30);

        // Apply smoothing and normalization
        const smoothingWindow = 3;
        const smoothed = spectrum.map((point, i, arr) => {
            if (i < smoothingWindow || i > arr.length - smoothingWindow) return point;

            const windowSlice = arr.slice(i - smoothingWindow, i + smoothingWindow + 1);
            const avgMagnitude = windowSlice.reduce((sum, p) => sum + p.magnitude, 0) / windowSlice.length;

            return { ...point, magnitude: avgMagnitude };
        });

        const maxMag = Math.max(...smoothed.map(p => p.magnitude));
        return smoothed.map(point => ({
            frequency: point.frequency,
            magnitude: maxMag > 0 ? (point.magnitude / maxMag) * 100 : 0
        }));
    }, [data, filterParams]);

    useEffect(() => {
        const newFFTData = calculateFFT();
        setFftData(newFFTData);
    }, [data, calculateFFT]);

    return (
        <Card className="shadow-lg">
            <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-semibold">
                    Noise Frequency Distribution
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="h-64">
                    <ResponsiveContainer>
                        <LineChart data={fftData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="frequency"
                                domain={[0, 30]}
                                ticks={[0, 5, 10, 15, 20, 25, 30]}
                                tick={{ fontSize: 12 }}
                                label={{
                                    value: 'Frequency (Hz)',
                                    position: 'insideBottomRight',
                                    offset: -10,
                                    style: { fontSize: '12px' }
                                }}
                            />
                            <YAxis
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                                tick={{ fontSize: 12 }}
                                label={{
                                    value: 'Magnitude (%)',
                                    angle: -90,
                                    position: 'insideLeft',
                                    offset: 15,
                                    style: { fontSize: '12px' }
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                }}
                                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Magnitude']}
                                labelFormatter={(label: number) => `${label.toFixed(1)} Hz`}
                            />
                            <Line
                                type="monotone"
                                dataKey="magnitude"
                                stroke="#ef4444"
                                dot={false}
                                strokeWidth={1.5}
                            />
                            <ReferenceLine
                                x={10.5}
                                stroke="#22c55e"
                                strokeDasharray="3 3"
                                label={{
                                    value: 'Target (10.5 Hz)',
                                    position: 'top',
                                    style: { fontSize: '12px', fill: '#22c55e' }
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-gray-600 font-medium">
                    Noise frequency components outside {
                        filterParams.bandpass.low.toFixed(1)
                    } - {
                        filterParams.bandpass.high.toFixed(1)
                    } Hz
                </div>
            </CardContent>
        </Card>
    );
};

export default FFT;