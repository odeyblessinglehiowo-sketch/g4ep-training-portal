import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const certificate = await prisma.certificate.findFirst({
    where: {
      status: "PENDING",
    },
    include: {
      student: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!certificate) {
    console.log("No certificate found.");
    return;
  }

  const updated = await prisma.certificate.update({
    where: {
      id: certificate.id,
    },
    data: {
      status: "ISSUED",
      certificateId: "G4EP-AKS-2026-0001",
      issuedAt: new Date(),
    },
  });

  console.log("Updated certificate:", updated);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });