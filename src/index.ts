import { Supadata, type Transcript } from "@supadata/js";
import OpenAI from "openai";
import { Bot } from "grammy";
import { TwitterApi } from "twitter-api-v2";

const apiKey = process.env.YOUTUBE_API_KEY;
const fireshipChannelId = "UCsBjURrPoezykLs9EqgamOA";

const supadata = new Supadata({
  apiKey: process.env.SUPADATA_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const bot = new Bot(process.env.TELEGRAM_BOT_API!);

const client = new TwitterApi({
  //@ts-ignore
  appKey: process.env.X_API_KEY!,
  appSecret: process.env.X_API_KEY_SECRET!,
  accessToken: process.env.X_ACCESS_TOKEN!,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET!,
  bearerToken: process.env.X_BEARER_TOKEN,
});

const getLatestVideoId = async () => {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&channelId=${fireshipChannelId}&type=video&maxResults=1&order=date`
  );
  const data = await response.json();
  const videoId = data.items[0].id.videoId;
  return videoId;
};

const getTranscript = async (videoId: string) => {
  const transcript: Transcript = await supadata.youtube.transcript({
    url: `https://youtu.be/${videoId}`,
  });
  return (JSON.parse(JSON.stringify(transcript.content)) as any[])
    .map((x) => x.text)
    .join(" ");
};

const generate = async (text: string) => {
  const response = await openai.responses.create({
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" }],
    input: `${text}\nDon't limit your knowledge to this text. Use a cool guy persona, and act like a gen z. Make all your text lowercase unless its a brand/product etc. Also dont use the word 'fam'`,
  });

  return response.output_text;
};

const getLatestNews = async () => {
  const response = await fetch(
    "https://data-api.coindesk.com/news/v1/article/list?lang=EN&limit=1&source_ids=coindesk"
  );
  const data = await response.json();
  return data.Data[0].BODY;
};

const sendTelegram = async (message: string) => {
  const res = await bot.api.sendMessage(-1002481719829, message, {
    reply_parameters: { message_id: 9 },
  });
  console.log(res);
};

const tweet = async (text: string) => {
  const rwClient = client.readWrite;
  try {
    await rwClient.v2.tweet(text);
    console.log("success");
  } catch (error) {
    console.error(error);
  }
};

export const youtube = async () => {
  const videoId = await getLatestVideoId();
  const transcript = await getTranscript(videoId);
  const tweetText = await generate(
    `${transcript}\n\nUse this YouTube transcript and create a tweet about it. Make the tweet about 30 words. use a hashtag if a product/company/etc`
  );
  const tele = await generate(
    `${transcript}\n\nUse this YouTube transcript and give me a 100 word article about it for telegram, dont use any formatting.`
  );
  await sendTelegram(tele);
  await tweet(tweetText);
};

export const news = async () => {
  const news = await getLatestNews();
  const tweetText = await generate(
    `${news}\n\nUse this news article to create a tweet. Make the tweet about 30 words. use a hashtag if a product/company/etc`
  );
  const tele = await generate(
    `${news}\n\nUse this text and give me a 100 word article about it for telegram, dont use any formatting.`
  );
  await sendTelegram(tele);
  await tweet(tweetText);
};

await news();
