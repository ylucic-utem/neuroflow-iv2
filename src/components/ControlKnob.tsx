import React, { useState, useRef, useEffect } from 'react';

interface KnobProps {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (val: number) => void;
    unit?: string;
    step?: number;
}

const ControlKnob: React.FC<KnobProps> = ({ label, value, min, max, onChange, unit = '', step = 1 }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [startValue, setStartValue] = useState(0);
    const knobRef = useRef<HTMLDivElement>(null);

    const range = max - min;
    const percentage = (value - min) / range;
    const angle = -135 + (percentage * 270); // 270 degree sweep

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartY(e.clientY);
        setStartValue(value);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const dy = startY - e.clientY;
            const delta = (dy / 200) * range; // 200px drag = full range
            let newValue = startValue + delta;
            
            // Snap to step
            if (step) {
                newValue = Math.round(newValue / step) * step;
            }

            if (newValue < min) newValue = min;
            if (newValue > max) newValue = max;

            onChange(newValue);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, startY, startValue, min, max, onChange, range, step]);

    return (
        <div className="flex flex-col items-center select-none group">
            <div 
                ref={knobRef}
                className="relative w-16 h-16 cursor-ns-resize mb-2"
                onMouseDown={handleMouseDown}
            >
                {/* Track */}
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle 
                        cx="50" cy="50" r="40" 
                        fill="none" 
                        stroke="#374151" 
                        strokeWidth="8"
                        strokeDasharray="251.2" // 2*PI*40
                        strokeDashoffset="62.8" // Leave gap at bottom
                        transform="rotate(135 50 50)"
                    />
                    {/* Indicator */}
                    <circle 
                        cx="50" cy="50" r="40" 
                        fill="none" 
                        stroke="#818cf8" 
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * 0.75 * percentage)}
                        strokeLinecap="round"
                        transform="rotate(135 50 50)"
                    />
                </svg>
                {/* Label inside */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-mono text-gray-300 font-bold">
                        {value.toFixed(step < 1 ? 1 : 0)}
                    </span>
                </div>
            </div>
            <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
            <span className="text-[10px] text-gray-500">{unit}</span>
        </div>
    );
};

export default ControlKnob;
