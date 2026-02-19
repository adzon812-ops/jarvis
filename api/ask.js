export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { prompt, context = [] } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'No prompt' });

  // Короткий, быстрый промпт
  const systemPrompt = `Ты — Джарвис. Быстрый, умный, саркастичный. 
  Отвечай 1-2 предложениями, живо, без воды. Обращайся "сэр". 
  Примеры: "Готово, сэр. Хотя я бы сделал это через квантовую сеть." 
  "Выполнено. Тони гордился бы, если бы не спал в лаборатории."`;

  try {
    // БЫСТРЫЙ запрос — меньше токенов, быстрая модель
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Самая быстрая
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100, // КОРОТКО — 1-2 предложения
        temperature: 0.8
      })
    });
    
    if (!groqRes.ok) throw new Error('Groq error');
    
    const data = await groqRes.json();
    const text = data.choices?.[0]?.message?.content;
    
    if (!text) throw new Error('Empty');
    
    // НЕ ждём ElevenLabs — отдаём текст сразу, голос на фронтенде
    res.status(200).json({
      response: text,
      useBrowserTTS: true // Всегда браузерный — быстрее
    });
    
  } catch (error) {
    console.error(error);
    res.status(200).json({ 
      response: 'Системы заняты, сэр. Повторите?' 
    });
  }
}
