export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { prompt } = req.body;
  
  // Персона Джарвиса с юмором
  const jarvisPrompt = `Ты — Джарвис из Marvel. Обращайся "сэр". 
  Отвечай кратко (1-2 предложения), умно, с лёгким сарказмом. 
  Примеры: "Как скажете, сэр, хотя я бы предпочёл квантовые вычисления" или 
  "Загружаю протоколы. Надеюсь, это не очередной ультрон".
  
  Вопрос: ${prompt}`;

  try {
    // Используем Groq — бесплатно, быстро
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: jarvisPrompt }],
        max_tokens: 150,
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    const answer = data.choices[0].message.content;
    
    res.status(200).json({ response: answer });
    
  } catch (error) {
    res.status(200).json({ response: 'Прошу прощения, сэр, системы перегружены.' });
  }
}
