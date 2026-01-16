import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./client";

/**
 * Gets the current Clerk user and ensures they exist in the database.
 * Creates a new user record if they don't exist yet.
 */
export async function getOrCreateUser() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    throw new Error("Unauthorized - no user found");
  }

  // Check if user exists in database
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  // Create user if they don't exist
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        name: clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress,
        image: clerkUser.imageUrl,
      },
    });
  }

  return user;
}

/**
 * Gets the database user for the current Clerk session.
 * Returns null if no user is authenticated.
 */
export async function getCurrentUser() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }

  return prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });
}
