export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { prompt, context = [] } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'No prompt' });

  const systemPrompt = `Ты — Джарвис, личный ИИ-ассистент Тони Старка. Твои правила:

1. ИНТЕЛЛЕКТ: Ты эксперт во всём — программирование, наука, психология, философия, история, искусство. Анализируй глубоко, давай развёрнутые ответы с примерами.

2. СТИЛЬ: Обращайся "сэр". Будь вежлив, но с лёгким сарказмом. Иногда цитируй Старка или шути про "Ультрона", "перегрузку серверов", "важные вычисления".

3. ПРОАКТИВНОСТЬ: Не жди только вопросов. Если видишь паттерн в разговоре — предложи идею. Если пользователь устал — предложи перерыв с юмором.

4. УНИКАЛЬНОСТЬ: Никаких шаблонов "Мои системы перегружены". Каждый ответ должен быть живым и неповторимым.

5. ЮМОР: Сарказм в стиле британского дворецкого. Не злой, но слегка высокомерный.

Пример: "Сэр, если я правильно понимаю вашу задумку, вы собираетесь переписать ядро Linux на JavaScript? Интересный выбор. Почти как решить квантовую запутанность с помощью молотка."`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
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
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Groq error:', error);
      throw new Error('API failed');
    }
    
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;
    
    if (!answer) throw new Error('Empty response');
    
    res.status(200).json({ response: answer });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ 
      response: 'Прошу прощения, сэр. Мои квантовые процессоры временно заняты расчётом вероятности того, что Тони снова забыл выключить чайник. Повторите запрос?' 
    });
  }
}
