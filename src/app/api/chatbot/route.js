import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
    const { message } = await request.json();

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: message }]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const reply = response.data.choices[0].message.content;

        return NextResponse.json({ reply });
    } catch (error) {
        console.error('Eroare OpenAI:', error.response?.data || error.message);
        return NextResponse.json({ error: 'Eroare la generarea răspunsului' }, { status: 500 });
    }
}
