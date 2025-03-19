import React, { useState } from "react";
import './App.css';

const EmployeeSearch = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);

    const searchEmployees = async () => {
        if (!query) return;
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data);
    };

    return (
        <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "auto", padding: "20px" }}>
            <h2>Mitarbeiter-Suche</h2>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Mitarbeiter mit bestimmten Fähigkeiten suchen..."
                style={{ display: "block", width: "100%", marginTop: "10px", padding: "10px" }}
            />
            <button onClick={searchEmployees} style={{ display: "block", width: "100%", marginTop: "10px", padding: "10px" }}>
                Suchen
            </button>
            <ul style={{ listStyleType: "none", padding: 0 }}>
                {results.map((employee, index) => (
                    <li key={index} style={{ background: "#f4f4f4", marginTop: "5px", padding: "10px", borderRadius: "5px" }}>
                        {employee.name} - {employee.skills.join(", ")}
                    </li>
                ))}
            </ul>
        </div>
    );
};

function App() {
    return (
        <div className="App">
            <EmployeeSearch />
        </div>
    );
}

export default App;