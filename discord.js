const axios = require('axios')
const fs = require('fs')
const { openAI } = require('./openai')
const { discordToken, timeout, discordUserId, discordChatId, botName } = require("./config.js")

const answeredQuestion = []

async function getLastMessage(messageCount, chatId){
    console.log("Получаем сообщения")
    return axios.get(`https://discord.com/api/v9/channels/${chatId}/messages`, {
        params: {
            'limit': messageCount
        },
        headers: {
            'authority': 'discord.com',
            'accept': '*/*',
            'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            'authorization': discordToken,
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
            'x-debug-options': 'bugReporterEnabled',
            'x-discord-locale': 'ru',
        }
    });
}

function getAppeal(messageArray){
    console.log("Получаем диалог")
    for(i of messageArray){
        if(i.referenced_message){
            if(i.referenced_message.author.id === discordUserId){
                return [
                    i.content,
                    {
                        "channel_id": i.channel_id,
                        "message_id": i.id
                    }
                ]
              }
        }
    }
    return undefined
}

async function sendMessage(chatId, messageContent, message_reference){
    console.log("Отправляем сообщение")
    return axios.post(
        `https://discord.com/api/v9/channels/${chatId}/messages`,
        {
            'content': messageContent,
            'tts': false,
            'message_reference': message_reference
        },
        {
            headers: {
                'authority': 'discord.com',
                'accept': '*/*',
                'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'authorization': discordToken,
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                'origin': 'https://discord.com',
                'pragma': 'no-cache',
                'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                'x-debug-options': 'bugReporterEnabled',
                'x-discord-locale': 'ru',
            }
        }
    )
}

function randInt(min, max) {
    return Math.round(Math.random() * (max - min) + min)
}

function createPrpompt(messageArray){
    fs.writeFileSync(
        'prompt.txt',
        ``
    )
    for (let i of messageArray){
        if(i.referenced_message){
            if(!i.content.includes('https://media.discordapp.net') && !i.referenced_message.content.includes('https://media.discordapp.net')){
                fs.appendFileSync(
                    'prompt.txt',
                    `Human:${i.referenced_message.content}\n${botName}:${i.content}\n`
                )
            }
        }
    }
}

async function getFoolConversation(message){ //получает на вход сообщение, если оно с ответами возвращает всю ветку
    fs.writeFileSync('prompt.txt', 
        `${botName}: ${message.referenced_message.content}\nHuman: ${message.content}`
    )
}

async function main(){
    console.log("Бот запущен!")
    const messageCount = '100'
    const chatId = discordChatId
    
    const messageForPrompt = await getLastMessage('100', chatId) //получаем сообщения для бота

    const response = await getLastMessage(messageCount, chatId)
    const messageArray = response.data

    const appeal = getAppeal(messageArray)
    let appealMessage, message_reference
    if(appeal !== undefined){
        [appealMessage, message_reference] = appeal
    }
    else{
        appealMessage = appeal
    }

    if(appealMessage && !answeredQuestion.includes(appealMessage)){
        getFoolConversation(i)
        const resp = await sendMessage(chatId, await openAI(appealMessage), message_reference)
        answeredQuestion.push(appealMessage)
    }
    else{
        const [randomMessage, message_reference] = (() => {
            while(true){
                const rn = randInt(0, messageCount-1)
                const messageAutor = messageArray[rn].author.id
                if(messageAutor === discordUserId && !answeredQuestion.includes(messageArray[rn].content)){
                    return [
                        messageArray[rn].content,
                        {
                            "channel_id": messageArray[rn].channel_id,
                            "message_id": messageArray[rn].id
                        }
                    ]
                }
            }            
        })()
        createPrpompt(messageForPrompt.data)
        const resp = await sendMessage(chatId, await openAI(randomMessage), message_reference) 
        answeredQuestion.push(randomMessage)
        console.log(answeredQuestion)
    }
}

main()
setInterval(main, timeout*1000)