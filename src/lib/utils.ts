import { bot, client, openai } from "./init";

export const generate = async (text: string) => {
  const response = await openai.responses.create({
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" }],
    input: `${text}\nDon't limit your knowledge to this text. Use a cool guy persona, and act like a gen z. Make all your text lowercase unless its a brand/product etc. Also dont use the word 'fam' or 'peeps'.`,
  });

  return response.output_text;
};

export const sendTelegram = async (message: string) => {
  const res = await bot.api.sendMessage(-1002481719829, message, {
    reply_parameters: { message_id: 9 },
  });
  console.log(res);
};

export const tweet = async (text: string) => {
  const rwClient = client.readWrite;
  try {
    await rwClient.v2.tweet(text);
    console.log("success");
  } catch (error) {
    console.error(error);
  }
};
