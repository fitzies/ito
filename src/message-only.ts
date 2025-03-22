import { getAndUpdateSource } from "./lib/db";
import { generate, sendTelegram } from "./lib/utils";

export const sendTelegramOnly = async () => {
  const source = await getAndUpdateSource(
    { messaged: false },
    { messaged: true }
  );
  if (!source) {
    console.log("Error getting source");
    return;
  }

  const tele = await generate(
    `${source.content}\n\nUse this text and give me a 50 word article about it for telegram. Use a lot new lines for clearer view. don't use any hashtags.`
  );
  await sendTelegram(tele);
};

await sendTelegramOnly();
