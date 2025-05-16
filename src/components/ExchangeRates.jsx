// src/components/ExchangeRates.jsx
import React, { useState, useEffect } from "react";

export default function ExchangeRates() {
  const [rates, setRates] = useState([]);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [fetchTime, setFetchTime] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [dateMessage, setDateMessage] = useState("");
  const [favorites, setFavorites] = useState([]);

  // Load favorites from localStorage on client only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const favs = localStorage.getItem("fav-codes");
      if (favs) setFavorites(JSON.parse(favs));
    }
  }, []);

  const fetchRates = async (date = "") => {
    setLoading(true);
    setError(""); // clear previous errors
    try {
      const url = date
        ? `https://api.nbp.pl/api/exchangerates/tables/a/${date}/?format=json`
        : `https://api.nbp.pl/api/exchangerates/tables/a/?format=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const [table] = await res.json();

      let newRates = table.rates;
      // sort favorites first
      newRates.sort((a, b) => {
        const aFav = favorites.includes(a.code);
        const bFav = favorites.includes(b.code);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return a.code.localeCompare(b.code);
      });

      setRates(newRates);
      setEffectiveDate(table.effectiveDate);
      setFetchTime(new Date().toLocaleString("pl-PL"));
      setDateMessage(
        date ? `Wyświetlono kursy z dnia ${table.effectiveDate}` : ""
      );
      // If loading current, clear selectedDate
      if (!date) setSelectedDate("");
    } catch (e) {
      setError(`Nie udało się załadować danych: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [favorites]);

  const toggleFavorite = (code) => {
    if (typeof window === "undefined") return;
    setFavorites((prev) => {
      const updated = prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code];
      localStorage.setItem("fav-codes", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div
      style={{
        backgroundColor: "#FFF9E6",
        padding: 20,
        borderRadius: 8,
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      }}>
      <h2>Kursy Walut NBP (Tabela A)</h2>
      <p>
        Data publikacji kursów: <strong>{effectiveDate || "—"}</strong>
      </p>
      <p>
        Data i godzina pobrania danych: <strong>{fetchTime || "—"}</strong>
      </p>
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => fetchRates()}>Odśwież dane</button>
        <button onClick={() => fetchRates()} style={{ marginLeft: 10 }}>
          Pokaż aktualne
        </button>
      </div>
      {error && (
        <div style={{ color: "red", margin: "10px 0", fontWeight: "bold" }}>
          {error}
        </div>
      )}
      <hr />

      <label>
        Wybierz datę:{" "}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setError(""); // clear errors on new date selection
            setSelectedDate(e.target.value);
          }}
        />
      </label>
      <button onClick={() => fetchRates(selectedDate)}>
        Pokaż kursy z wybranej daty
      </button>
      {dateMessage && (
        <div style={{ margin: "10px 0", fontStyle: "italic" }}>
          {dateMessage}
        </div>
      )}
      <hr />

      {loading ? (
        <p style={{ fontStyle: "italic" }}>Ładowanie danych...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#FFE0B2" }}>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>⭐</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Waluta</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Kod</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>
                Kurs średni
              </th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>
                Szczegóły
              </th>
            </tr>
          </thead>
          <tbody>
            {rates.map((r) => (
              <tr key={r.code}>
                <td
                  style={{
                    padding: 8,
                    border: "1px solid #ddd",
                    textAlign: "center",
                  }}>
                  <button
                    onClick={() => toggleFavorite(r.code)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      color: "black",
                    }}>
                    {favorites.includes(r.code) ? "★" : "☆"}
                  </button>
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {r.currency}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {r.code}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  {r.mid.toFixed(4)}
                </td>
                <td style={{ padding: 8, border: "1px solid #ddd" }}>
                  <a
                    href={`/currency/${r.code.toLowerCase()}`}
                    style={{ fontWeight: "bold" }}>
                    Zobacz szczegóły
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
