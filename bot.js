// 必要なライブラリを読み込む
const { Client, Events, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const { token, channelid } = require('./config.json'); // トークンとチャンネルIDを読み込む
const studioid = "hoge"; // スタジオID

// 送信済みコメントのIDを保存するセット
let sentCommentIds = new Set();

// Discordのクライアントを作成
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// クライアントが準備完了したときに一度だけ実行される関数
client.once(Events.ClientReady, c => {
    console.log(`OK login ${c.user.tag}`);
    setInterval(fetchAndSendNewComments, 60000); // 1分ごとにコメントを取得する
});

// Discordにログイン
client.login(token);

// コメントを取得し、新しいコメントのみを送信する関数
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

// Discordにメッセージを送信する関数
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
