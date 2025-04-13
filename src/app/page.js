'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function Home() {
    const [status, setStatus] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [replyText, setReplyText] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);
    const recognitionRef = useRef(null);

    // Load conversation from localStorage on mount
    useEffect(() => {
        const storedHistory = localStorage.getItem('conversationHistory');
        if (storedHistory) {
            setConversationHistory(JSON.parse(storedHistory));
        }
    }, []);

    // Save conversation to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
    }, [conversationHistory]);

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
        recognition.lang = 'ro-RO';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onstart = () => {
            setIsListening(true);
            setStatus('Listening...');
        };

        recognition.onend = () => {
            setIsListening(false);
            setStatus('Idle');

            // After speech recognition ends, automatically submit the message
            handleSubmit();
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                interimTranscript += result[0].transcript;
                if (result.isFinal) {
                    setTranscript(interimTranscript);
                }
            }
            setTranscript(interimTranscript);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleSubmit = async () => {
        if (transcript.trim() === '') return;

        try {
            setStatus('Sending to GPT...');
            const res = await fetch('/api/chatbot', {
                method: 'POST',
                body: JSON.stringify({ message: transcript }),
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await res.json();

            if (data.reply) {
                setReplyText(data.reply);

                // Add to conversation history
                setConversationHistory(prev => [
                    ...prev,
                    { question: transcript, answer: data.reply }
                ]);
            }

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

            setStatus('Done!');
        } catch (err) {
            setStatus('Error occurred');
            console.error(err);
        }
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
                placeholder="Ce ai spus va apărea aici..."
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

            {replyText && (
                <div
                    style={{
                        marginTop: '2rem',
                        padding: '1rem',
                        backgroundColor: '#000',
                        borderRadius: '8px',
                        fontSize: '1.1rem',
                        color: '#fff',
                    }}
                >
                    <strong>ChatGPT:</strong> {replyText}
                </div>
            )}
        </main>
    );
}
