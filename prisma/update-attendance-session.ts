import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const session = await prisma.attendanceSession.findFirst({
    where: {
      code: "WD-QR-001",
    },
  });

  if (!session) {
    console.log("No attendance session found.");
    return;
  }

  const updated = await prisma.attendanceSession.update({
    where: {
      id: session.id,
    },
    data: {
      isActive: true,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  });

  console.log("Attendance session updated:", updated);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });