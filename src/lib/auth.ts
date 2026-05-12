import { prisma } from "@/lib/prisma";

const fallbackDevUserId = "00000000-0000-0000-0000-000000000001";
const fallbackDevUserEmail = "dev@example.com";

export async function requireCurrentUser() {
  const id = process.env.DEV_USER_ID ?? fallbackDevUserId;
  const email = process.env.DEV_USER_EMAIL ?? fallbackDevUserEmail;

  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      id,
      email,
      name: "Local MVP User",
    },
  });
}
