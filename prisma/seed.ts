import bcrypt from "bcrypt";
import {
  PrismaClient,
  Role,
  SubmissionStatus,
  CertificateStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = "123456";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@g4ep.org" },
    update: {
      name: "Portal Admin",
      password: hashedPassword,
      role: Role.ADMIN,
    },
    create: {
      name: "Portal Admin",
      email: "admin@g4ep.org",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@g4ep.org" },
    update: {
      name: "Teacher One",
      password: hashedPassword,
      role: Role.TEACHER,
    },
    create: {
      name: "Teacher One",
      email: "teacher@g4ep.org",
      password: hashedPassword,
      role: Role.TEACHER,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "student@g4ep.org" },
    update: {
      name: "Blessing Student",
      password: hashedPassword,
      role: Role.STUDENT,
    },
    create: {
      name: "Blessing Student",
      email: "student@g4ep.org",
      password: hashedPassword,
      role: Role.STUDENT,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {
      track: "Web Design",
    },
    create: {
      userId: teacherUser.id,
      track: "Web Design",
    },
  });

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {
      track: "Web Design",
    },
    create: {
      userId: studentUser.id,
      track: "Web Design",
    },
  });

  const existingHtmlResource = await prisma.resource.findFirst({
    where: {
      title: "HTML & CSS Starter Guide",
      track: "Web Design",
    },
  });

  if (!existingHtmlResource) {
    await prisma.resource.create({
      data: {
        title: "HTML & CSS Starter Guide",
        track: "Web Design",
        fileUrl: "/resources/html-css-guide.pdf",
      },
    });
  }

  const existingJsResource = await prisma.resource.findFirst({
    where: {
      title: "JavaScript Basics",
      track: "Web Design",
    },
  });

  if (!existingJsResource) {
    await prisma.resource.create({
      data: {
        title: "JavaScript Basics",
        track: "Web Design",
        fileUrl: "/resources/javascript-basics.pdf",
      },
    });
  }

  const existingSubmission = await prisma.submission.findFirst({
    where: {
      studentId: student.id,
      title: "My First Portfolio Project",
    },
  });

  if (!existingSubmission) {
    await prisma.submission.create({
      data: {
        studentId: student.id,
        title: "My First Portfolio Project",
        fileUrl: "https://example.com/portfolio",
        status: SubmissionStatus.PENDING,
      },
    });
  }

    const existingCertificate = await prisma.certificate.findFirst({
    where: {
      studentId: student.id,
    },
  });

  if (!existingCertificate) {
    await prisma.certificate.create({
      data: {
        studentId: student.id,
        status: CertificateStatus.PENDING,
      },
    });
  }

  console.log("Seed data created successfully.");
  console.log({
    admin,
    teacherUser,
    teacher,
    studentUser,
    student,
  });
  console.log("Login password for all seeded users:", defaultPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });