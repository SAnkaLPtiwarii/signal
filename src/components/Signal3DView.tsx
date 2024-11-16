import { useState, useEffect, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip } from 'recharts';

interface DataPoint {
    time: number;
    amplitude: number;
    frequency: number;
    depth: number;
    amplitude2: number;
    frequency2: number;
}

const Signal3DView: React.FC = () => {
    const [data3D, setData3D] = useState<DataPoint[]>([]);
    const [rotation, setRotation] = useState(0);
    const animationRef = useRef<number | undefined>(undefined);

    const generate3DData = (angle: number): DataPoint[] => {
        const data: DataPoint[] = [];
        for (let i = 0; i < 100; i++) {
            data.push({
                time: i * 0.1,
                amplitude: Math.sin(i * 0.1 + angle),
                frequency: 10,
                depth: Math.cos(i * 0.1 + angle),
                amplitude2: Math.sin(i * 0.1 + angle + Math.PI),
                frequency2: 5
            });
        }
        return data;
    };

    useEffect(() => {
        const animate = () => {
            setRotation((prev) => (prev + 0.02) % (2 * Math.PI));
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setData3D(generate3DData(rotation));
    }, [rotation]);

    return (
        <ScatterChart width={500} height={300} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis dataKey="time" name="Time" />
            <YAxis dataKey="amplitude" name="Amplitude" />
            <ZAxis dataKey="depth" range={[0, 100]} name="Depth" />
            <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value: number, name: string) => [value.toFixed(2), name]}
            />
            <Scatter name="Signal" data={data3D} fill="#8884d8" />
        </ScatterChart>
    );
};

export default Signal3DView;