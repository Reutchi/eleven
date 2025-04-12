export async function POST(request) {
    const { message } = await request.json();

    // Răspuns dummy de la chatbot
    const reply = `"${message}"`;

    return Response.json({ reply });
}
