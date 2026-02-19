export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { prompt, context = [] } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'No prompt' });

  const systemPrompt = `Ты — Джарвис, личный ИИ-ассистент Тони Старка. 
  Блестящий интеллект, сарказм, обращайся "сэр". Живые ответы, без шаблонов.`;

  try {
    // LLM
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          ...context.slice(-10).map(c => ({ 
            role: c.role === 'user' ? 'user' : 'assistant', 
            content: c.content 
          })),
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.9
      })
    });
    
    if (!groqRes.ok) throw new Error('Groq error');
    
    const groqData = await groqRes.json();
    const text = groqData.choices?.[0]?.message?.content;
    
    if (!text) throw new Error('Empty response');

    // Пробуем ElevenLabs
    let voiceUrl = null;
    let useBrowserTTS = true;
    
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam
        
        const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_turbo_v2',
            voice_settings: {
              stability: 0.35,
              similarity_boost: 0.8,
              style: 0.4
            }
          })
        });
        
        if (elevenRes.ok) {
          const audioBuffer = await elevenRes.arrayBuffer();
          const base64 = Buffer.from(audioBuffer).toString('base64');
          voiceUrl = `data:audio/mp3;base64,${base64}`;
          useBrowserTTS = false;
          console.log('ElevenLabs OK');
        } else {
          console.log('ElevenLabs error:', elevenRes.status);
        }
      } catch (e) {
        console.log('ElevenLabs failed:', e.message);
      }
    }
    
    res.status(200).json({
      response: text,
      voiceUrl: voiceUrl,
      useBrowserTTS: useBrowserTTS
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ 
      response: 'Технические неполадки, сэр. Повторите?',
      voiceUrl: null,
      useBrowserTTS: true
    });
  }
}
