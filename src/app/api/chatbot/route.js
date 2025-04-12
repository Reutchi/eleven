export async function POST(request) {
    const { message } = await request.json();

    const reply = `"${message}"`;

    return Response.json({ reply });
}
