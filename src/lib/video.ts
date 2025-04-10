import fs from "fs";
import path from "path";
import { openai } from "./init";
import ffmpeg from "fluent-ffmpeg";

export async function generateTikTokVideo(script: string, debug = false) {
  const videoPath = path.join(__dirname, "../assets/minecraft-parkour.mp4");

  // Convert script to AI voice
  const speechFile = path.join(__dirname, "../assets/speech.mp3");
  await generateSpeech(script, speechFile);

  // Get audio duration to calculate precise timing
  const audioDuration = await getAudioDuration(speechFile);

  // Generate text overlays with improved timing
  const wordOverlays = generateImprovedWordOverlays(script, audioDuration);

  // Group words into 2-word chunks
  const groupedOverlays = createGroupedOverlays(wordOverlays, 1);

  // Create a subtitle file with improved styling and bounce effect
  const subtitlePath = path.join(__dirname, "../assets/subtitles.ass");
  createGroupedSubtitleFile(groupedOverlays, subtitlePath);

  // Combine everything using subtitles and crop to TikTok size
  await combineVideoAudioWithSubtitles(videoPath, speechFile, subtitlePath);

  // If debug mode is enabled, create a version with timestamps
  if (debug) {
    const debugSubtitlePath = path.join(
      __dirname,
      "../assets/debug-subtitles.ass"
    );
    createDebugSubtitleFile(groupedOverlays, debugSubtitlePath);
    await combineVideoAudioWithSubtitles(
      videoPath,
      speechFile,
      debugSubtitlePath,
      path.join(__dirname, "../../output/debug-video.mp4")
    );
  }

  console.log("TikTok-style video generated successfully!");
}

async function generateSpeech(text: string, outputPath: string) {
  // Make sure the directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "echo", // You can choose different voices
    input: text,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(outputPath, buffer);
}

// Function to get audio duration using ffmpeg
function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata.format.duration || 0);
    });
  });
}

// Improved word timing calculation
function generateImprovedWordOverlays(script: string, totalDuration: number) {
  // Split script into words, filtering out empty strings
  const words = script.split(/\s+/).filter((word) => word.length > 0);

  // Calculate variable duration based on word length
  const wordDurations = words.map((word) => {
    // Base duration + additional time for longer words
    return 0.2 + Math.min(0.05 * word.length, 0.3);
  });

  // Account for punctuation pauses
  for (let i = 0; i < words.length; i++) {
    if (words[i].match(/[,.!?;:]$/)) {
      wordDurations[i] += 0.15; // Add pause for punctuation
    }
  }

  // Calculate total calculated duration
  const calculatedTotalDuration = wordDurations.reduce(
    (sum, duration) => sum + duration,
    0
  );

  // Scale durations to match actual audio length
  const scaleFactor = totalDuration / calculatedTotalDuration;
  const scaledDurations = wordDurations.map(
    (duration) => duration * scaleFactor
  );

  // Generate overlays with calculated timings
  let currentTime = 0;
  return words.map((word, index) => {
    const startTime = currentTime;
    const endTime = startTime + scaledDurations[index];
    currentTime = endTime;

    return {
      text: word.trim(),
      startTime,
      endTime,
    };
  });
}

// Group words into chunks of specified size
function createGroupedOverlays(
  wordOverlays: Array<{ text: string; startTime: number; endTime: number }>,
  groupSize: number = 3
) {
  const result: Array<{ text: string; startTime: number; endTime: number }> =
    [];

  // Group words into chunks of groupSize
  for (let i = 0; i < wordOverlays.length; i += groupSize) {
    const group = wordOverlays.slice(
      i,
      Math.min(i + groupSize, wordOverlays.length)
    );

    if (group.length > 0) {
      // Use the start time of the first word and end time of the last word in the group
      const startTime = group[0].startTime;
      const endTime = group[group.length - 1].endTime;
      const text = group.map((item) => item.text).join(" ");

      result.push({
        text,
        startTime,
        endTime,
      });
    }
  }

  return result;
}

// Function to format time for ASS file (H:MM:SS.cc)
function formatAssTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const centisecs = Math.floor((seconds % 1) * 100);

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(
    2,
    "0"
  )}.${String(centisecs).padStart(2, "0")}`;
}

// Create a subtitle file for grouped words
function createGroupedSubtitleFile(
  overlays: Array<{ text: string; startTime: number; endTime: number }>,
  outputPath: string
) {
  // ASS header with improved style definition
  let assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TikTok,Arial,120,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,6,2,5,10,10,150,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  overlays.forEach((overlay) => {
    const startTimeFormatted = formatAssTime(overlay.startTime);
    const endTimeFormatted = formatAssTime(overlay.endTime);

    // Add the subtitle line with a bounce effect
    assContent += `Dialogue: 0,${startTimeFormatted},${endTimeFormatted},TikTok,,0,0,0,,{\\move(540,960,540,960)\\fscx110\\fscy110\\t(0,0.15,\\fscx100\\fscy100)}${overlay.text}\n`;
  });

  fs.writeFileSync(outputPath, assContent);
}

// Create a debug subtitle file with timing information
function createDebugSubtitleFile(
  overlays: Array<{ text: string; startTime: number; endTime: number }>,
  outputPath: string
) {
  let assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TikTok,Arial,80,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,6,2,5,10,10,150,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  overlays.forEach((overlay) => {
    const startTimeFormatted = formatAssTime(overlay.startTime);
    const endTimeFormatted = formatAssTime(overlay.endTime);

    // Add timing information to the subtitle for debugging
    assContent += `Dialogue: 0,${startTimeFormatted},${endTimeFormatted},TikTok,,0,0,0,,{\\pos(540,960)}${
      overlay.text
    } [${overlay.startTime.toFixed(2)}-${overlay.endTime.toFixed(2)}]\n`;
  });

  fs.writeFileSync(outputPath, assContent);
}

// Combine video and audio with subtitles and crop to TikTok size
async function combineVideoAudioWithSubtitles(
  videoPath: string,
  audioPath: string,
  subtitlePath: string,
  outputPath: string = path.join(__dirname, "../../output/final-video.mp4")
) {
  // Make sure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .input(audioPath)
      .outputOptions([
        "-map 0:v",
        "-map 1:a",
        "-c:v libx264",
        "-c:a aac",
        "-vf",
        // Crop to 9:16 aspect ratio (TikTok size) and add subtitles
        `crop=ih*9/16:ih,scale=1080:1920,subtitles=${subtitlePath}`,
        "-shortest",
        "-pix_fmt yuv420p",
      ])
      .on("end", () => {
        console.log(`Processing finished successfully: ${outputPath}`);
        resolve();
      })
      .on("error", (err) => {
        console.error("Error:", err);
        reject(err);
      })
      .save(outputPath);
  });
}
