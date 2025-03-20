import prisma from "./prisma";
import type { Source } from "@prisma/client";

export const getAndUpdateSource = async (
  where: {
    tweeted?: boolean;
    messaged?: boolean;
  },
  data: {
    tweeted?: boolean;
    messaged?: boolean;
  }
): Promise<Source | null> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const source = await tx.source.findFirst({
        where: where,
        orderBy: { createdAt: "desc" }, // Changed from "asc" to "desc" for latest post
      });

      if (!source) {
        return null;
      }

      return await tx.source.update({
        where: { id: source.id },
        data,
      });
    });
  } catch (error) {
    console.error("Failed to get and update source:", error);
    throw error;
  }
};
