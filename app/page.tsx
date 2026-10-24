"use client";

import { useRef, useState } from "react";

const MAX_CHARS = 8000;
const MIN_CHARS = 50;

const STYLES = [
  { value: "short", label: "Short" },
  { value: "bullets", label: "Bullet points" },
  { value: "detailed", label: "Detailed" },
];

const SAMPLE_TEXT =
  "Photosynthesis is the process by which green plants, algae, and some bacteria convert light energy into chemical energy. " +
  "Using chlorophyll in their chloroplasts, they absorb sunlight and use it to turn carbon dioxide from the air and water from the soil " +
  "into glucose and oxygen. The glucose provides energy and building material for growth, while the oxygen is released into the atmosphere. " +
  "This process is the foundation of most food chains on Earth and is responsible for the oxygen that most living organisms breathe. " +
  "Factors such as light intensity, carbon dioxide concentration, and temperature affect how fast photosynthesis occurs.";

export default function Home() {
  const [text, setText] = useState("");
  const [style, setStyle] = useState("short");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const trimmedLength = text.trim().length;
  const overLimit = text.length > MAX_CHARS;

  async function handleSummarise() {
    setError("");
    setSummary("");

    // Client-side validation
    if (!trimmedLength) return setError("Please paste some text first.");
    if (trimmedLength < MIN_CHARS)
      return setError(`Text is too short. Enter at least ${MIN_CHARS} characters.`);
    if (overLimit)
      return setError(`Text is too long. Maximum is ${MAX_CHARS} characters.`);

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, style }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Request failed (${res.status}).`);
      }
      if (!res.body) throw new Error("No response from server.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        setSummary(result);
      }

      if (!result.trim()) {
        throw new Error("The AI returned an empty response. Please try again.");
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError((err as Error).message || "Something went wrong.");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900">AI Text Summariser</h1>
        <p className="mt-1 text-gray-600">
          Paste an article, notes, or any long text and get a summary instantly.
        </p>

        <div className="mt-6 rounded-xl bg-white p-5 shadow">
          <div className="flex items-center justify-between">
            <label htmlFor="input" className="text-sm font-medium text-gray-700">
              Your text
            </label>
            <button
              type="button"
              onClick={() => setText(SAMPLE_TEXT)}
              disabled={loading}
              className="text-sm text-blue-600 hover:underline disabled:opacity-50"
            >
              Try sample text
            </button>
          </div>
          <textarea
            id="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            rows={10}
            placeholder="Paste your text here..."
            className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-gray-900 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          />
          <div
            className={`mt-1 text-right text-xs ${
              overLimit ? "font-semibold text-red-600" : "text-gray-500"
            }`}
          >
            {text.length} / {MAX_CHARS}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStyle(s.value)}
                  disabled={loading}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    style === s.value
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {loading ? (
              <button
                onClick={handleStop}
                className="rounded-lg bg-red-600 px-5 py-2 font-medium text-white hover:bg-red-700"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={handleSummarise}
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
              >
                Summarise
              </button>
            )}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        {(loading || summary) && (
          <div className="mt-4 rounded-xl bg-white p-5 shadow">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Summary</h2>
              {summary && !loading && (
                <button
                  onClick={handleCopy}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>

            {loading && !summary && (
              <div className="mt-3 flex items-center gap-2 text-gray-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                Reading your text...
              </div>
            )}

            <p className="mt-3 whitespace-pre-wrap text-gray-800">{summary}</p>
          </div>
        )}
      </div>
    </main>
  );
}
