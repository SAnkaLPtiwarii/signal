import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, PlayCircle, PauseCircle, Upload, Waves, Zap } from 'lucide-react';
import { type SignalDataPoint } from './utils/dataGenerators';
import FFT from './FFT'

const SAMPLE_RATE = 1000;
const WINDOW_DURATION = 1;
const UPDATE_INTERVAL = 1000 / 30;

// Helper functions
// const calculateSignalStrength = (data: SignalDataPoint[], targetFreq: number): number => {
//     if (!data.length) return 0;
//     const signalPower = data.reduce((acc, point) => {
//         const freq = 1 / (2 * Math.PI * point.time);
//         const isNearTarget = Math.abs(freq - targetFreq) <= 0.5;
//         if (isNearTarget) {
//             return acc + Math.pow(point.filtered, 2);
//         }
//         return acc;
//     }, 0);
//     return Math.sqrt(signalPower / data.length);
// };

// const calculateNoiseLevel = (data: SignalDataPoint[]): number => {
//     if (!data.length) return 0;
//     const noisePower = data.reduce((acc, point) => {
//         const noise = point.original - point.filtered;
//         return acc + Math.pow(noise, 2);
//     }, 0);
//     return Math.sqrt(noisePower / data.length);
// };

interface FilterParams {
    bandpass: {
        low: number;
        high: number;
    };
}

interface Metrics {
    snr: number;
    quality: number;
    frequency: number;
}

const SignalAnalysisDashboard: React.FC = () => {
    // State declarations

    const [error, setError] = useState<string | null>(null);
    const [rawData, setRawData] = useState<SignalDataPoint[]>([]);
    const [displayData, setDisplayData] = useState<SignalDataPoint[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [filterParams, setFilterParams] = useState<FilterParams>({
        bandpass: { low: 7.6, high: 11.5 }
    });
    const [metrics, setMetrics] = useState<Metrics>({
        snr: 0,
        quality: 0,
        frequency: 0
    });
    const animationRef = useRef<number | null>(null);

    // Helper Functions
    const applyBandpassFilter = useCallback((signal: number, freq: number, params: FilterParams): number => {
        const { low, high } = params.bandpass;
        const center = (high + low) / 2;
        const bandwidth = high - low;
        const normalizedFreq = (freq - center) / (bandwidth / 2);
        const response = 1 / (1 + Math.pow(normalizedFreq, 2));
        return signal * response;
    }, []);

    const calculateMetrics = useCallback((data: SignalDataPoint[]): Metrics => {
        if (data.length === 0) {
            return { snr: 0, quality: 0, frequency: 0 };
        }

        const signalPower = data.reduce((acc, point) => {
            return acc + Math.pow(point.filtered, 2);
        }, 0);

        const noisePower = data.reduce((acc, point) => {
            const noise = point.original - point.filtered;
            return acc + Math.pow(noise, 2);
        }, 0);

        const snr = noisePower === 0 ? 0 : 10 * Math.log10(signalPower / noisePower);

        const quality = data.reduce((acc, point) => {
            const signalAmplitude = Math.abs(point.filtered);
            const noiseAmplitude = Math.abs(point.original - point.filtered);
            return acc + (signalAmplitude / (signalAmplitude + noiseAmplitude));
        }, 0) / data.length * 100;

        const zeroCrossings = data.reduce((count, point, i) => {
            if (i === 0) return 0;
            return data[i - 1].filtered * point.filtered < 0 ? count + 1 : count;
        }, 0);

        const timeSpan = data[data.length - 1].time - data[0].time;
        const frequency = (zeroCrossings / 2) / timeSpan;

        return { snr, quality, frequency };
    }, []);

    const handleBandpassChange = useCallback((range: [number, number]) => {
        const [low, high] = range;
        setFilterParams(prev => ({
            ...prev,
            bandpass: { low, high }
        }));
    }, []);

    // File Upload Handler
    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (text) {
                try {
                    const lines = text.trim().split('\n');
                    const parsedData = lines.map((line) => {
                        const [time, original] = line.split(',').map(Number);
                        return {
                            time,
                            original,
                            filtered: original,
                            instantFreq: 1 / (2 * Math.PI * time),
                            amplitude: Math.abs(original)
                        };
                    });

                    setRawData(parsedData);
                    setCurrentIndex(0);
                    setIsAnimating(false);
                } catch (error) {
                    setError(error instanceof Error ? error.message : 'Error processing CSV');
                }
            }
        };
        reader.readAsText(file);
    }, []);

    useEffect(() => {
        if (rawData.length === 0) return;

        const filteredData = rawData.map(point => {
            const freq = 1 / (2 * Math.PI * point.time);
            const filtered = applyBandpassFilter(point.original, freq, filterParams);
            return {
                ...point,
                filtered,
                instantFreq: freq
            };
        });

        setDisplayData(filteredData);
        const newMetrics = calculateMetrics(filteredData);
        setMetrics(newMetrics);
    }, [filterParams, rawData, applyBandpassFilter, calculateMetrics]);

    useEffect(() => {
        if (!isAnimating || !rawData.length) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            return;
        }

        let lastTimestamp = 0;
        const windowSize = Math.floor(SAMPLE_RATE * WINDOW_DURATION);

        const animate = (timestamp: number) => {
            if (timestamp - lastTimestamp >= UPDATE_INTERVAL) {
                const startIdx = currentIndex % rawData.length;
                const endIdx = Math.min(startIdx + windowSize, rawData.length);
                let windowData = rawData.slice(startIdx, endIdx);

                if (windowData.length < windowSize) {
                    const remainingSize = windowSize - windowData.length;
                    windowData = [...windowData, ...rawData.slice(0, remainingSize)];
                }

                const processedData = windowData.map(point => ({
                    ...point,
                    filtered: applyBandpassFilter(point.original, point.instantFreq, filterParams),
                }));

                setDisplayData(processedData);
                setMetrics(calculateMetrics(processedData));
                setCurrentIndex(prev => (prev + Math.floor(windowSize / 30)) % rawData.length);
                lastTimestamp = timestamp;
            }
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isAnimating, rawData, currentIndex, filterParams, applyBandpassFilter, calculateMetrics]);

    // const CustomizedAxisTick: React.FC<any> = ({ x, y, payload }) => {
    //     return (
    //         <g transform={`translate(${x},${y})`}>
    //             <text
    //                 x={0}
    //                 y={0}
    //                 dy={16}
    //                 textAnchor="middle"
    //                 className="text-xs font-medium"
    //             >
    //                 {Number(payload.value).toFixed(2)}
    //             </text>
    //         </g>
    //     );
    // };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Signal Analysis Suite</h1>
                        <p className="text-gray-500">CSV Data Analysis</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                            <label className="cursor-pointer flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                Load CSV
                            </label>
                        </Button>
                        <Button
                            className="gap-2"
                            onClick={() => setIsAnimating(!isAnimating)}
                            disabled={!rawData.length}
                        >
                            {isAnimating ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                            {isAnimating ? 'Pause' : 'Animate'}
                        </Button>
                    </div>
                </div>

                {/* Metrics Display */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-500">SNR</p>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {metrics.snr.toFixed(1)} dB
                                    </div>
                                </div>
                                <Waves className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-500">Frequency</p>
                                    <div className="text-2xl font-bold text-green-600">
                                        {metrics.frequency.toFixed(1)} Hz
                                    </div>
                                </div>
                                <Activity className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-500">Quality</p>
                                    <div className="text-2xl font-bold text-purple-600">
                                        {metrics.quality.toFixed(0)}%
                                    </div>
                                </div>
                                <Zap className="h-8 w-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Left Column - Signal Visualization */}
                    <div className="col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="w-5 h-5" />
                                    Signal Visualization
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-96">
                                    <ResponsiveContainer>
                                        <LineChart data={displayData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="time"
                                                domain={['dataMin', 'dataMax']}
                                                tickFormatter={(value) => {
                                                    return typeof value === 'number' ? value.toFixed(3) : value;
                                                }}
                                                tick={{ fontSize: 12 }}
                                                label={{
                                                    value: 'Time (s)',
                                                    position: 'insideBottom',
                                                    offset: -5,
                                                    style: { fontSize: '12px' }
                                                }}
                                            />
                                            <YAxis
                                                domain={['auto', 'auto']}
                                                tickFormatter={(value) => {
                                                    return typeof value === 'number' ? value.toFixed(1) : value;
                                                }}
                                                tick={{ fontSize: 12 }}
                                                label={{
                                                    value: 'Amplitude (mV)',
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
                                                formatter={(value: any) => {
                                                    return typeof value === 'number' ? [value.toFixed(2), ''] : [value, ''];
                                                }}
                                            />
                                            <Legend
                                                wrapperStyle={{ fontSize: '12px' }}
                                                verticalAlign="top"
                                                height={36}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="original"
                                                stroke="#8884d8"
                                                name="Original"
                                                dot={false}
                                                isAnimationActive={false}
                                                strokeWidth={1.5}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="filtered"
                                                stroke="#82ca9d"
                                                name="Filtered"
                                                dot={false}
                                                isAnimationActive={false}
                                                strokeWidth={1.5}
                                            />
                                        </LineChart>

                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Controls and Analysis */}
                    <div className="space-y-6">
                        {/* Filter Controls */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Bandpass Filter Controls</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium">
                                            Lower Cutoff: {filterParams.bandpass.low.toFixed(1)} Hz
                                        </label>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="20"
                                            step="0.1"
                                            value={filterParams.bandpass.low}
                                            onChange={(e) => handleBandpassChange([
                                                parseFloat(e.target.value),
                                                filterParams.bandpass.high
                                            ])}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">
                                            Upper Cutoff: {filterParams.bandpass.high.toFixed(1)} Hz
                                        </label>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="20"
                                            step="0.1"
                                            value={filterParams.bandpass.high}
                                            onChange={(e) => handleBandpassChange([
                                                filterParams.bandpass.low,
                                                parseFloat(e.target.value)
                                            ])}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Filter Frequency Response */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Filter Frequency Response</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64">
                                    <ResponsiveContainer>
                                        <LineChart
                                            data={Array.from({ length: 200 }, (_, i) => ({
                                                frequency: i * 0.2,
                                                response: -20 * Math.log10(1 + Math.pow(
                                                    (i * 0.2 - (filterParams.bandpass.high + filterParams.bandpass.low) / 2) /
                                                    ((filterParams.bandpass.high - filterParams.bandpass.low) / 2),
                                                    2
                                                ))
                                            }))}
                                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="frequency"
                                                label={{
                                                    value: 'Frequency (Hz)',
                                                    position: 'insideBottomRight',
                                                    offset: -10,
                                                    style: { fontSize: '12px' }
                                                }}
                                                domain={[0, 30]}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis
                                                label={{
                                                    value: 'Magnitude (dB)',
                                                    angle: -90,
                                                    position: 'insideLeft',
                                                    offset: 15,
                                                    style: { fontSize: '12px' }
                                                }}
                                                domain={[-60, 5]}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '4px',
                                                    fontSize: '12px'
                                                }}
                                                formatter={(value: number) => [`${value.toFixed(1)} dB`, 'Response']}
                                                labelFormatter={(label: number) => `${label.toFixed(1)} Hz`}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="response"
                                                stroke="#2563eb"
                                                dot={false}
                                                strokeWidth={1.5}
                                            />
                                            <ReferenceLine
                                                y={-3}
                                                stroke="red"
                                                strokeDasharray="3 3"
                                                label={{
                                                    value: '-3 dB',
                                                    position: 'right',
                                                    style: { fontSize: '12px', fill: 'red' }
                                                }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                    <div>Passband: {filterParams.bandpass.low.toFixed(1)} - {filterParams.bandpass.high.toFixed(1)} Hz</div>
                                    <div>Q-factor: {((filterParams.bandpass.high + filterParams.bandpass.low) /
                                        (filterParams.bandpass.high - filterParams.bandpass.low)).toFixed(2)}</div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Noise Frequency Distribution */}
                        <FFT
                            data={displayData}
                            filterParams={filterParams}
                        />

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                                <span className="block sm:inline">{error}</span>
                                <button
                                    className="absolute top-0 right-0 px-4 py-3"
                                    onClick={() => setError(null)}
                                >
                                    <span className="sr-only">Close</span>
                                    ×
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignalAnalysisDashboard;