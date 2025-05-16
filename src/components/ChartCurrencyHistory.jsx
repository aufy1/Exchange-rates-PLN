// src/components/ChartCurrencyHistory.jsx
import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";

export default function ChartCurrencyHistory({ code }) {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChart() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `https://api.nbp.pl/api/exchangerates/rates/a/${code}/last/30/?format=json`
        );
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();

        const labels = data.rates.map((r) => r.effectiveDate);
        const values = data.rates.map((r) => r.mid);

        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) throw new Error("Canvas context not available");

        // Destroy existing chart if present
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        // Create new chart instance
        chartInstance.current = new Chart(ctx, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: `Kurs ${code.toUpperCase()} (ostatnie 30 dni)`,
                data: values,
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                fill: true,
                tension: 0.3,
                pointRadius: 3,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: true },
              tooltip: { mode: "index", intersect: false },
            },
            scales: {
              x: { title: { display: true, text: "Data" } },
              y: { title: { display: true, text: "Kurs średni (PLN)" } },
            },
          },
        });
      } catch (e) {
        console.error("Chart load error:", e);
        setError("Nie udało się załadować wykresu historycznego.");
      } finally {
        setLoading(false);
      }
    }

    loadChart();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [code]);

  return (
    <div style={{ position: "relative" }}>
      {loading && <p style={{ fontStyle: "italic" }}>Ładowanie wykresu...</p>}
      {error && <div style={{ color: "red", margin: "10px 0" }}>{error}</div>}
      {/* Canvas zawsze renderowany, nawet gdy loading/error */}
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        style={{ marginTop: "20px", opacity: loading ? 0.5 : 1 }}
      />
    </div>
  );
}
