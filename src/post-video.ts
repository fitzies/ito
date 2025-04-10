import { getAndUpdateSource } from "./lib/db";
import { generateText } from "./lib/utils";
import { generateTikTokVideo } from "./lib/video";

const postVideo = async () => {
  const source = await getAndUpdateSource(
    { messaged: false },
    { messaged: true }
  );
  if (!source) {
    console.log("Error getting source");
    return;
  }
  const script = await generateText(
    `${source.content}\n\nUse this text and give me a 50 word script for tiktok. Dont use any new lines. Just give me the script.`
  );

  await generateTikTokVideo(script, true);
};

await postVideo();
