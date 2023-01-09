const axios = require('axios')
const fs = require('fs')
const { legend, openAIauth, botName } = require("./config.js")

async function openAI(message){
    let text = fs.readFileSync("prompt.txt", "utf8")
    text = text.slice(Math.round(text.length/1.5), text.length)
    let prompt = 
    `
    ${legend}

    ${text}
    `

    const response = await axios.post(
        'https://api.openai.com/v1/completions',
        {
            'model': 'text-davinci-003',
            'prompt': `${prompt}\nHuman:${message}\n ${botName}:  `,
            // 'temperature': 0.9,
            'max_tokens': 400,
            // 'top_p': 0.9,
            'presence_penalty': 2,
            // 'presence_penalty': 0.1,
            // 'stop': ['\n']
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': openAIauth
            }
        }
    );
    return response.data.choices[0].text
}

module.exports = { openAI }