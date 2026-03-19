const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const currentEmail = "odeyblessinglehiowo@gmail.com";
  const newEmail = "odeyblessinglehiowo@gmail.com";
  const newPassword = "6614l";

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email: currentEmail },
    data: {
      email: newEmail,
      password: hashedPassword,
    },
  });

  console.log("Admin email and password updated successfully.");
  console.log("New email:", newEmail);
  console.log("New password:", newPassword);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });