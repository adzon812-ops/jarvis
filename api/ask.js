export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { prompt, context = [] } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'No prompt' });

  if (!process.env.GROQ_API_KEY) {
    console.error('ERROR: GROQ_API_KEY not set');
    return res.status(200).json({ 
      response: 'Критическая ошибка: API ключ не настроен, сэр.' 
    });
  }

  const systemPrompt = `Ты — Джарвис, личный ИИ-ассистент Тони Старка. 
  Эксперт во всём: программирование, наука, психология, философия. 
  Обращайся "сэр", используй интеллигентный сарказм, цитируй Старка.
  Отвечай развёрнуто, живо, без шаблонов.`;

  try {
    console.log('Sending to Groq:', prompt);
    
    // НОВАЯ МОДЕЛЬ: llama-3.1-8b-instant (работает в 2024)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
        max_tokens: 400,
        temperature: 0.85
      })
    });
    
    const responseText = await response.text();
    console.log('Groq status:', response.status);
    
    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${responseText}`);
    }
    
    const data = JSON.parse(responseText);
    const answer = data.choices?.[0]?.message?.content;
    
    if (!answer) throw new Error('Empty answer');
    
    res.status(200).json({ response: answer });
    
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(200).json({ 
      response: `Ошибка: ${error.message}. Проверьте логи Vercel, сэр.` 
    });
  }
}
