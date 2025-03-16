import axios from "axios";
import prisma from "./lib/prisma";

interface SourceData {
  TYPE: string;
  ID: number;
  SOURCE_KEY: string;
  NAME: string;
  IMAGE_URL: string;
  URL: string;
  LANG: string;
  SOURCE_TYPE: string;
  LAUNCH_DATE: number | null;
  SORT_ORDER: number;
  BENCHMARK_SCORE: number;
  STATUS: string;
  LAST_UPDATED_TS: number;
  CREATED_ON: number;
  UPDATED_ON: number;
}

interface Post {
  TYPE: string;
  ID: number;
  GUID: string;
  PUBLISHED_ON: number;
  IMAGE_URL: string;
  TITLE: string;
  URL: string;
  SOURCE_ID: number;
  BODY: string;
  KEYWORDS: string;
  LANG: string;
  UPVOTES: number;
  DOWNVOTES: number;
  SCORE: number;
  SENTIMENT: string;
  STATUS: string;
  CREATED_ON: number;
  UPDATED_ON: number | null;
  SOURCE_DATA: SourceData;
  CATEGORY_DATA: any[];
}

interface ApiResponse {
  Data: Post[];
  Err: Record<string, any>;
}

async function syncPostsWithDatabase(apiResponse: ApiResponse): Promise<void> {
  try {
    // Check if there are any posts in the response
    if (!apiResponse.Data || apiResponse.Data.length === 0) {
      console.log("No posts found in the API response");
      return;
    }

    // Process each post
    for (const post of apiResponse.Data) {
      // Check if the post already exists in the database
      const existingPost = await prisma.source.findUnique({
        where: {
          id: post.ID,
        },
      });

      // If post doesn't exist, create it
      if (!existingPost) {
        await prisma.source.create({
          data: {
            id: post.ID,
            title: post.TITLE,
            content: post.BODY,
            posted: false, // Default value as per schema
            createdAt: new Date(post.CREATED_ON * 1000), // Convert Unix timestamp to Date
            postedAt: post.PUBLISHED_ON
              ? new Date(post.PUBLISHED_ON * 1000)
              : null,
          },
        });
        console.log(`Added new post with ID ${post.ID} to database`);
      } else {
        // Optionally update existing post if needed
        await prisma.source.update({
          where: {
            id: post.ID,
          },
          data: {
            title: post.TITLE,
            content: post.BODY,
            postedAt: post.PUBLISHED_ON
              ? new Date(post.PUBLISHED_ON * 1000)
              : null,
          },
        });
        console.log(`Updated existing post with ID ${post.ID}`);
      }
    }

    console.log("Post synchronization completed successfully");
  } catch (error) {
    console.error("Error syncing posts with database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function fetchPosts(): Promise<ApiResponse> {
  try {
    const response = await axios.get(
      "https://data-api.coindesk.com/news/v1/article/list?lang=EN&limit=5"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching posts from API:", error);
    throw error;
  }
}

async function main() {
  try {
    // Fetch posts from API
    const apiResponse = await fetchPosts();

    // Sync posts with database
    await syncPostsWithDatabase(apiResponse);

    console.log("Synchronization process completed");
  } catch (error) {
    console.error("Error in main process:", error);
  }
}

main().catch(console.error);
