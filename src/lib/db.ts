import prisma from "./prisma";
import type { Source } from "@prisma/client";

export const getAndUpdateSource = async (): Promise<Source | null> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const source = await tx.source.findFirst({
        where: { posted: false },
        orderBy: { createdAt: "desc" }, // Changed from "asc" to "desc" for latest post
      });

      if (!source) {
        return null;
      }

      return await tx.source.update({
        where: { id: source.id },
        data: { posted: true },
      });
    });
  } catch (error) {
    console.error("Failed to get and update source:", error);
    throw error;
  }
};
