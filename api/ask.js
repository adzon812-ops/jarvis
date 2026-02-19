export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'No prompt' });

  try {
    // Быстрый LLM
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{
          role: 'system',
          content: 'Ты Джарвис из Marvel. Живой, быстрый, саркастичный. Отвечай энергично, 1-2 предложения. Обращайся сэр.'
        }, {
          role: 'user',
          content: prompt
        }],
        max_tokens: 100,
        temperature: 0.9
      })
    });
    
    const groqData = await groqRes.json();
    const text = groqData.choices?.[0]?.message?.content || 'Система занята, сэр.';
    
    // Пробуем ElevenLabs — голос Adam (похож на Джарвиса)
    let audioBase64 = null;
    
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const elevenRes = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_turbo_v2',
            voice_settings: {
              stability: 0.4,
              similarity_boost: 0.8,
              style: 0.5
            }
          })
        });
        
        if (elevenRes.ok) {
          const buffer = await elevenRes.arrayBuffer();
          audioBase64 = Buffer.from(buffer).toString('base64');
        }
      } catch (e) {
        console.log('ElevenLabs failed:', e.message);
      }
    }
    
    res.status(200).json({
      response: text,
      audio: audioBase64 ? `data:audio/mp3;base64,${audioBase64}` : null
    });
    
  } catch (error) {
    res.status(200).json({ 
      response: 'Ошибка связи, сэр',
      audio: null
    });
  }
}
