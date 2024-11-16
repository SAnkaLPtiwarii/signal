import React from 'react';
import { Card, CardContent } from './ui/card';
import { Activity, Signal, Zap } from 'lucide-react';

interface MetricProps {
    snr: number;
    frequency: number;
    quality: number;
}

const RealTimeMetrics: React.FC<MetricProps> = ({ snr, frequency, quality }) => {
    return (
        <div className="grid grid-cols-3 gap-4">
            <Card>
                <CardContent className="pt-4">
                    <div className="flex flex-col items-center">
                        <Activity className="h-8 w-8 text-blue-500 mb-2" />
                        <h3 className="text-sm font-medium">SNR</h3>
                        <p className="text-2xl font-bold text-blue-600">{snr.toFixed(1)} dB</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-4">
                    <div className="flex flex-col items-center">
                        <Signal className="h-8 w-8 text-green-500 mb-2" />
                        <h3 className="text-sm font-medium">Frequency</h3>
                        <p className="text-2xl font-bold text-green-600">{frequency.toFixed(1)} Hz</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-4">
                    <div className="flex flex-col items-center">
                        <Zap className="h-8 w-8 text-purple-500 mb-2" />
                        <h3 className="text-sm font-medium">Quality</h3>
                        <p className="text-2xl font-bold text-purple-600">{quality.toFixed(0)}%</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default RealTimeMetrics;