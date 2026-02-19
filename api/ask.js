export default async function handler(req, res) {
  // CORS — разрешаем запросы с любого сайта
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { prompt, context = [] } = req.body || {};
  
  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  const systemPrompt = `Ты — Джарвис, личный ИИ-ассистент. Обращайся "сэр". 
  Сарказм в стиле Marvel, умный, краткий (2-4 предложения). 
  Можешь шутить про "Ультрона" и "перегрузку серверов".`;

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
          ...context.slice(-4).map(c => ({ 
            role: c.role === 'user' ? 'user' : 'assistant', 
            content: c.content 
          })),
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
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
