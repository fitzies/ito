import { Supadata, type Transcript } from "@supadata/js";
import OpenAI from "openai";
import { Bot } from "grammy";
import { TwitterApi } from "twitter-api-v2";

export const supadata = new Supadata({
  apiKey: process.env.SUPADATA_API_KEY!,
});

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const bot = new Bot(process.env.TELEGRAM_BOT_API!);

export const client = new TwitterApi({
  //@ts-ignore
  appKey: process.env.X_API_KEY!,
  appSecret: process.env.X_API_KEY_SECRET!,
  accessToken: process.env.X_ACCESS_TOKEN!,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET!,
  bearerToken: process.env.X_BEARER_TOKEN,
});
