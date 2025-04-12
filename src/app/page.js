'use client';

import React, { useRef, useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState('Idle');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const handleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Web Speech API not supported in this browser.');
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
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('Listening...');
    };

    recognition.onend = () => {
      setIsListening(false);
      setStatus('Idle');
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setStatus(`You said: "${transcript}"`);

      // Trimite la chatbot
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        body: JSON.stringify({ message: transcript }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      // Trimite la ElevenLabs
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

    recognitionRef.current = recognition;
    recognition.start();
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
        <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>Status: {status}</p>
      </main>
  );
}
