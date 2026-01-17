import { useState, useEffect, useRef } from 'react';
import * as webllm from "@mlc-ai/web-llm";

export const useWebLLM = () => {
    const [engine, setEngine] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState("");
    const [output, setOutput] = useState("");

    // Initialize Engine
    const initEngine = async () => {
        setIsLoading(true);
        try {
            // Using TinyLlama or Gemma-2b as requested. 
            // Note: This downloads ~1-2GB of weights to cache.
            const selectedModel = "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC";
            const eng = await webllm.CreateMLCEngine(selectedModel, {
                initProgressCallback: (report) => {
                    setProgress(report.text);
                }
            });
            setEngine(eng);
            setIsLoading(false);
        } catch (err) {
            console.error("LLM Init Error:", err);
            setProgress("Error loading model: " + err.message);
            setIsLoading(false);
        }
    };

    const generate = async (prompt) => {
        if (!engine) return;

        // Reset output
        setOutput("");

        try {
            const chunks = await engine.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                stream: true,
            });

            let fullReply = "";
            for await (const chunk of chunks) {
                const choice = chunk.choices[0];
                const content = choice?.delta?.content || "";
                fullReply += content;
                setOutput(fullReply);
            }
        } catch (err) {
            console.error("Generation Error:", err);
            setOutput("Error generating response.");
        }
    };

    return {
        initEngine,
        isLoading,
        progress,
        output,
        generate,
        isReady: !!engine
    };
};
