import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Label } from './ui/label';

interface FilterControlsProps {
    bandpassRange: [number, number];
    lowpassCutoff: number;
    highpassCutoff: number;
    onBandpassChange: (values: [number, number]) => void;
    onLowpassChange: (value: number) => void;
    onHighpassChange: (value: number) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
    bandpassRange,
    onBandpassChange
}) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Bandpass Filter Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Lower Cutoff Frequency</Label>
                    <Slider
                        defaultValue={[bandpassRange[0]]}
                        min={1}
                        max={20}
                        step={0.1}
                        onValueChange={(values) => onBandpassChange([values[0], bandpassRange[1]])}
                    />
                </div>
                <div>
                    <Label>Upper Cutoff Frequency</Label>
                    <Slider
                        defaultValue={[bandpassRange[1]]}
                        min={1}
                        max={20}
                        step={0.1}
                        onValueChange={(values) => onBandpassChange([bandpassRange[0], values[0]])}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default FilterControls;