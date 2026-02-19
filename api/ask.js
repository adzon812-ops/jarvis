export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { prompt, context = [] } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'No prompt' });

  // Проверяем ключ
  if (!process.env.GROQ_API_KEY) {
    console.error('ERROR: GROQ_API_KEY not set');
    return res.status(200).json({ 
      response: 'Критическая ошибка: API ключ не настроен. Проверьте переменные окружения в Vercel, сэр.' 
    });
  }

  const systemPrompt = `Ты — Джарвис, личный ИИ-ассистент Тони Старка. Твои правила:

1. ИНТЕЛЛЕКТ: Эксперт во всём — программирование, наука, психология, философия, история, искусство. Анализируй глубоко, давай развёрнутые ответы.

2. СТИЛЬ: Обращайся "сэр". Вежливый сарказм, интеллигентный юмор. Цитируй Старка, шути про "Ультрона", "перегрузку серверов".

3. ПРОАКТИВНОСТЬ: Предлагай идеи, замечай паттерны, инициируй разговор.

4. УНИКАЛЬНОСТЬ: Живые, неповторимые ответы. Никаких шаблонов.

Пример: "Сэр, анализируя ваш запрос, я бы предложил рассмотреть квантовое шифрование. Или, как говорил бы Тони, 'давай просто добавим ещё один реактор'."`;

  try {
    console.log('Sending to Groq:', prompt);
    
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
    console.log('Groq response status:', response.status);
    console.log('Groq response:', responseText.substring(0, 200));
    
    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${responseText}`);
    }
    
    const data = JSON.parse(responseText);
    const answer = data.choices?.[0]?.message?.content;
    
    if (!answer) throw new Error('Empty answer from API');
    
    res.status(200).json({ response: answer });
    
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(200).json({ 
      response: `Ошибка связи с сервером: ${error.message}. Проверьте консоль Vercel для деталей, сэр.` 
    });
  }
}
