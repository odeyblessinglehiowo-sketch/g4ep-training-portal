import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="w-full border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo/g4ep.png"
            alt="G4EP Logo"
            width={40}
            height={40}
          />
          <span className="text-lg font-bold text-green-700">
            G4EP Project RISE
          </span>
        </Link>

        <div className="flex gap-6 text-sm font-medium text-gray-700">
          <Link href="/">Home</Link>
          <Link href="/login">Login</Link>
          <Link href="/student/dashboard">Student</Link>
          <Link href="/teacher/dashboard">Teacher</Link>
          <Link href="/admin/dashboard">Admin</Link>
        </div>
      </div>
    </nav>
  );
}