export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'No prompt' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Ты Джарвис. Отвечай коротко, с юмором, обращайся сэр. 1-2 предложения.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 80,
        temperature: 0.8
      })
    });
    
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Система занята, сэр.';
    
    res.status(200).json({ response: text });
    
  } catch (error) {
    res.status(200).json({ response: 'Ошибка связи. Проверьте ключ API, сэр.' });
  }
}
