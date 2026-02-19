// api/ask.js — стабильная версия для Vercel
export default async function handler(req, res) {
  // CORS для работы с любого устройства
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { prompt, context = [] } = req.body || {};
  
  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  // Персона Джарвиса
  const systemPrompt = `Ты — Джарвис, личный ИИ-ассистент премиум-класса. 
  Технический эксперт, психолог, собеседник. Обращайся "сэр".
  Сарказм в стиле Marvel, но уважительный. Отвечай 2-4 предложения, живо.
  Можешь шутить про "Ультрона", "перегрузку серверов", "важные вычисления".`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          ...context.slice(-6).map(c => ({ 
            role: c.role === 'user' ? 'user' : 'assistant', 
            content: c.content 
          })),
          { role: 'user', content: prompt }
        ],
        max_tokens: 250,
        temperature: 0.8
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'Системная ошибка, сэр.';
    
    res.status(200).json({ response: answer });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ 
      response: 'Мои системы испытывают технические трудности. Возможно, Тони снова что-то сломал.' 
    });
  }
}
