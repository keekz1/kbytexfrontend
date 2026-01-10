// App.jsx
import { useState } from "react";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt) return;

    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/ai/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY4MDA1ODU2LCJpYXQiOjE3NjgwMDIyNTYsImp0aSI6IjgzNjFkY2RmMzk4NDRkZTBiZWIxMWRhODY3ZWJlODMxIiwidXNlcl9pZCI6IjEifQ.QmSL6z8fWJEHhsZCWU2tn5klSHLFFdJ-F1bvvA-7HK8"
        },
        body: JSON.stringify({
          prompt: prompt,
          subject: "Python",
          difficulty: "Beginner"
        })
      });

      const data = await res.json();
      setResponse(data.answer || "No response received.");
    } catch (err) {
      console.error(err);
      setResponse("Error connecting to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>AI Study Helper</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a question..."
          style={{ width: "300px", padding: "0.5rem" }}
        />
        <button type="submit" style={{ padding: "0.5rem 1rem", marginLeft: "0.5rem" }}>
          Ask
        </button>
      </form>
      {loading && <p>Loading...</p>}
      {response && (
        <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc" }}>
          <strong>AI Response:</strong>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
