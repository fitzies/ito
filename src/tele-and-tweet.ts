import { getAndUpdateSource } from "./lib/db";
import { generate, sendTelegram, tweet } from "./lib/utils";

export const teleAndTweet = async () => {
  const source = await getAndUpdateSource(
    { tweeted: false, messaged: false },
    { tweeted: true, messaged: true }
  );
  if (!source) {
    console.log("Error getting source");
    return;
  }

  const tweetText = await generate(
    `${source.content}\n\nUse this news article to create a tweet. Make the tweet about 30 words. use a hashtag if a product/company/etc and include statstics if any.`
  );
  const tele = await generate(
    `${source.content}\n\nUse this text and give me a 100 word article about it for telegram.`
  );
  await sendTelegram(tele);
  await tweet(tweetText);
};

await teleAndTweet();
