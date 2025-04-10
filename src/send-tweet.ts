import { getAndUpdateSource } from "./lib/db";
import { generateText, sendTelegram, postTweet } from "./lib/utils";

export const sendTweet = async () => {
  const source = await getAndUpdateSource(
    { tweeted: false },
    { tweeted: true }
  );
  if (!source) {
    console.log("Error getting source");
    return;
  }

  const tweetText = await generateText(
    `${source.content}\n\nUse this news article to create a tweet. Make the tweet about 30 words. use a hashtag if a product/company/etc and include statstics if any.`
  );

  await postTweet(tweetText);
};

await sendTweet();
