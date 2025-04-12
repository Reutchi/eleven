'use client';

import React, { useState, useRef } from 'react';

export default function Home() {
    const [status, setStatus] = useState('Idle');
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);

    const handleVoice = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Web Speech API not supported in this browser. Try using Chrome or Firefox.');
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            setStatus('Stopped');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US'; // sau 'ro-RO' pentru română
        recognition.interimResults = true; // Permite să obținem rezultate intermediare (pe măsură ce vorbești)
        recognition.continuous = false;

        recognition.onstart = () => {
            setIsListening(true);
            setStatus('Listening...');
        };

        recognition.onend = () => {
            setIsListening(false);
            setStatus('Idle');
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                interimTranscript += result[0].transcript;

                // Dacă există un rezultat final, actualizează transcrierea completă
                if (result.isFinal) {
                    setTranscript(interimTranscript);
                }
            }
            // Actualizează transcrierea intermediară pe măsură ce utilizatorul vorbește
            setTranscript(interimTranscript);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleSubmit = async () => {
        if (transcript.trim() === '') return;

        // Trimitem transcriptul către API-ul chatbot
        const res = await fetch('/api/chatbot', {
            method: 'POST',
            body: JSON.stringify({ message: transcript }),
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await res.json();

        // Trimitem răspunsul chatbotului pentru a genera audio cu ElevenLabs
        setStatus('Generating voice...');
        const audioRes = await fetch('/api/elevenlabs', {
            method: 'POST',
            body: JSON.stringify({ text: data.reply }),
            headers: { 'Content-Type': 'application/json' },
        });

        const audioBlob = await audioRes.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    };

    return (
        <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
            <h1>🎤 Voice Chatbot</h1>
            <button
                onClick={handleVoice}
                style={{
                    padding: '1rem 2rem',
                    fontSize: '1.2rem',
                    backgroundColor: isListening ? 'red' : 'green',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                }}
            >
                {isListening ? 'Stop' : 'Start Voice'}
            </button>

            <input
                type="text"
                value={transcript}
                readOnly
                style={{
                    width: '100%',
                    padding: '1rem',
                    marginTop: '1rem',
                    fontSize: '1.2rem',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                }}
            />

            <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>Status: {status}</p>

            <button
                onClick={handleSubmit}
                style={{
                    padding: '1rem 2rem',
                    fontSize: '1.2rem',
                    backgroundColor: '#007BFF',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    marginTop: '1rem',
                }}
            >
                Submit Message
            </button>
        </main>
    );
}
