
const { Client, Events, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const { token, channelid } = require('./config.json'); 
const studioid = "hoge"; // スタジオID


let sentCommentIds = new Set();


const client = new Client({ intents: [GatewayIntentBits.Guilds] });


client.once(Events.ClientReady, c => {
    console.log(`OK login ${c.user.tag}`);
    setInterval(fetchAndSendNewComments, 60000); 
});


client.login(token);

function fetchAndSendNewComments() {
    axios.get(`https://api.scratch.mit.edu/studios/${studioid}/comments?offset=0&limit=40`)
        .then(response => {
            const comments = response.data;
            if (comments.length > 0) {
                // 新しいコメントのみをフィルター
                const newComments = comments.filter(comment => !sentCommentIds.has(comment.id));
                if (newComments.length > 0) {
                    // コメントを古い順に並べ替え
                    newComments.sort((a, b) => new Date(a.datetime_created) - new Date(b.datetime_created));
                    // コメントを一つずつ送信
                    newComments.forEach(comment => {
                        const messageContent = `[@${comment.author.username}](https://scratch.mit.edu/users/${comment.author.username}): ${comment.content}`;
                        sendMessageToDiscord(messageContent);
                        // 送信済みコメントのIDを保存
                        sentCommentIds.add(comment.id);
                    });
                } else {
                    console.log('新しいコメントがありません');
                }
            } else {
                console.log('コメントがありません');
            }
        })
        .catch(error => {
            console.error('コメントの取得中にエラーが発生しました:', error);
        });
}


function sendMessageToDiscord(messageContent) {
    const channel = client.channels.cache.get(channelid);
    if (channel) {
        channel.send({ content: messageContent })
            .then(() => console.log('メッセージを送信しました'))
            .catch(console.error);
    } else {
        console.error('チャンネルが見つかりません');
    }
}
