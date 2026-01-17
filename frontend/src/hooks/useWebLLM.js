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
            // Switching to Gemma-2b-it which is better at following instructions and support Turkish better than TinyLlama
            const selectedModel = "gemma-2b-it-q4f32_1-MLC";
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

    const generate = async (input) => {
        if (!engine) return;

        // Reset output
        setOutput("");

        try {
            // Allow passing either a string (legacy) or messages array
            const messages = Array.isArray(input) ? input : [{ role: "user", content: input }];

            const chunks = await engine.chat.completions.create({
                messages: messages,
                stream: true,
                temperature: 0.7, // Add some creativity but keep it grounded
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
