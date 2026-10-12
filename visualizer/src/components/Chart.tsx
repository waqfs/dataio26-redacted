import { useRef, useEffect } from 'preact/hooks';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface ChartProps {
  type: string;
  data: any;
  options?: any;
  height?: number;
}

export function ChartComponent({ type, data, options, height }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: type as any,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...options,
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [type, data, options]);

  return (
    <div style={{ height: height || 350, position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
