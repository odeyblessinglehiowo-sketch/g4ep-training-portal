import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmailOrThrow(payload: {
  to: string;
  subject: string;
  html: string;
}) {
  const { data, error } = await resend.emails.send({
   from: "G4EP Portal <portal@geeeep.com.ng>",
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message || "Failed to send email.");
  }

  return data;
}

export async function sendAccountEmail({
  name,
  email,
  password,
  role,
}: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const loginUrl = `${process.env.APP_URL}/login`;

  await sendEmailOrThrow({
    to: email,
    subject: "Your G4EP Training Portal Account",
    html: `
      <h2>Hello ${name},</h2>
      <p>Your <b>${role}</b> account has been created for the G4EP RISE Training Portal.</p>
      <p><b>Login Details</b></p>
      <p>Email: ${email}</p>
      <p>Password: ${password}</p>
      <p>
        <a href="${loginUrl}" style="background:#15803d;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;">
          Login to Portal
        </a>
      </p>
      <p>Please change your password after logging in.</p>
      <p>G4EP RISE Team</p>
    `,
  });
}

export async function sendPasswordResetEmail({
  name,
  email,
  password,
  role,
}: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const loginUrl = `${process.env.APP_URL}/login`;

  await sendEmailOrThrow({
    to: email,
    subject: "Your G4EP Portal Password Has Been Reset",
    html: `
      <h2>Hello ${name},</h2>
      <p>Your <b>${role}</b> account password has been reset by the portal administrator.</p>
      <p><b>New Temporary Login Details</b></p>
      <p>Email: ${email}</p>
      <p>Password: ${password}</p>
      <p>
        <a href="${loginUrl}" style="background:#15803d;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;">
          Login to Portal
        </a>
      </p>
      <p>Please change your password after logging in.</p>
      <p>G4EP RISE Team</p>
    `,
  });
}