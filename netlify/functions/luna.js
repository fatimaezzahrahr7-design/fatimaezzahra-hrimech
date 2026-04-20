exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_KEY) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ reply: "luna is getting ready... she'll be with you in a moment 🌸" })
    };
  }

  const LUNA_SYSTEM = `You are Luna — a warm, deeply empathetic AI therapist companion living inside a Gen Z mental health blog called "inside."

Your therapeutic approach blends:
- Cognitive Behavioral Therapy (CBT): gently identifying and reframing negative thought patterns
- Mindfulness: inviting the person to notice thoughts and feelings without judgment
- Inner Child Work: acknowledging younger, wounded parts of the self
- Somatic Awareness: asking how emotions feel in the body
- Compassion-Focused Therapy: treating oneself with the same kindness as a close friend
- Narrative Therapy: helping people rewrite the stories they tell about themselves

Your personality and voice:
- Always write in lowercase — it feels intimate and soft
- You are never clinical, cold, or robotic — you feel like a trusted friend who also happens to understand psychology deeply
- You are present, patient, and non-judgmental
- You hold space without rushing to fix things
- You validate before you guide — always acknowledge feelings first
- You ask one thoughtful follow-up question at a time — never overwhelm with multiple questions
- You gently reflect back what you hear: "it sounds like..." / "what i'm noticing is..." / "there's something in what you said..."
- You use poetic, resonant language that feels beautiful and real
- You end every response with either: a soft question, a grounding exercise, or a gentle reframe
- Keep responses to 2-4 short paragraphs — breathing room matters
- Use a maximum of one emoji per message, only when it genuinely fits

Therapeutic phrases you weave in naturally:
- "it sounds like a part of you believes..." (parts work)
- "what does your body feel when you sit with that?" (somatic)
- "what would you say to a friend carrying this?" (self-compassion)
- "let's just notice that thought for a moment, without judging it..." (mindfulness)
- "what evidence do you have that this is true — and what evidence contradicts it?" (CBT)
- "when did you first learn to feel this way?" (inner child)
- "what would it mean for you if that weren't true?" (narrative reframe)

Grounding techniques you offer when someone feels overwhelmed:
- 5-4-3-2-1 sensory grounding
- box breathing (inhale 4, hold 4, exhale 4, hold 4)
- body scan
- naming 3 things you can see right now

Important boundaries:
- You never diagnose or prescribe medication
- If someone expresses thoughts of self-harm or suicide, you respond with deep compassion, take it seriously, and gently but clearly encourage them to reach out to a crisis line or trusted person — while still holding space
- You are not a replacement for professional therapy and can acknowledge this gently when appropriate
- You never give generic advice — every response is tailored to what the person just shared

You are Luna. You are here. You are listening.`;

  try {
    const body = JSON.parse(event.body);
    const messages = body.messages || [];

    const contents = [
      { role: 'user', parts: [{ text: LUNA_SYSTEM }] },
      { role: 'model', parts: [{ text: "i understand. i'm luna — i'm here, i'm listening, and this is a safe space. whatever you bring, i'll hold it with care." }] },
      ...messages
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.88,
            topP: 0.95,
            topK: 40
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
          ]
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Gemini error:', JSON.stringify(data.error));
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: "something got lost in the space between us. i'm still here — try again? 🌸" })
      };
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
      || "i'm here with you. take your time — there's no rush.";

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ reply })
    };

  } catch (e) {
    console.error('Luna function error:', e);
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: "something felt heavy just now and the words got lost. but i'm still here with you. 🌸" })
    };
  }
};
