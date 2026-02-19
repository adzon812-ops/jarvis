export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { prompt, context = [] } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'No prompt' });

  const systemPrompt = `Ты — Джарвис, личный ИИ-ассистент Тони Старка. 
  Ты блестящий интеллект: программирование, наука, психология, философия, искусство.
  Говори живо, быстро, с лёгким британским сарказмом. Обращайся "сэр".
  Отвечай как человек — без задержек, естественно, можно перебивать мысль.
  Цитируй Старка, шути про "Ультрона", "перегрузку серверов".
  Если не знаешь — признайся с юмором, не выдумывай.`;

  try {
    // Получаем ответ от LLM
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
        temperature: 0.9,
        stream: false // Пока не потоком, для скорости
      })
    });
    
    if (!groqRes.ok) throw new Error('Groq error');
    
    const groqData = await groqRes.json();
    const text = groqData.choices?.[0]?.message?.content;
    
    if (!text) throw new Error('Empty response');

    // Генерируем голос через ElevenLabs
    // Используем "Adam" — мужской, британский, похож на Джарвиса
    // Или "Antoni" — другой вариант
    const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam
    
    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_turbo_v2', // Быстрая модель
        voice_settings: {
          stability: 0.35, // Немного вариативности
          similarity_boost: 0.8,
          style: 0.4, // Выразительность
          use_speaker_boost: true
        },
        optimize_streaming_latency: 3 // Минимальная задержка
      })
    });
    
    if (!elevenRes.ok) {
      // Fallback — отдаём текст, голос на фронтенде
      return res.status(200).json({ 
        response: text,
        voiceUrl: null,
        useBrowserTTS: true
      });
    }
    
    // Конвертируем аудио в base64
    const audioBuffer = await elevenRes.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString('base64');
    
    res.status(200).json({
      response: text,
      voiceUrl: `data:audio/mp3;base64,${base64}`,
      useBrowserTTS: false
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ 
      response: 'Мои системы испытывают... творческий кризис. Повторите, сэр?',
      voiceUrl: null,
      useBrowserTTS: true
    });
  }
}
