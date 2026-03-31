"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PortalFooter from "@/components/portal-footer";
import { Globe, School, Monitor, Code2 } from "lucide-react";

export const dynamic = "force-dynamic";

type StatItem = {
  value: number;
  suffix: string;
  label: string;
  icon: React.ReactNode;
};

type TrackItem = {
  name: string;
  icon: string;
  desc: string;
};

type TestimonialItem = {
  quote: string;
  name: string;
  role: string;
  image: string;
};

function Counter({
  end,
  suffix = "",
  duration = 1800,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(step);
  }, [started, end, duration]);

  return (
    <div ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </div>
  );
}

function StatCard({ item }: { item: StatItem }) {
  return (
    <div className="rounded-[1.75rem] border border-green-100 bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-700 ring-1 ring-green-100">
        <div className="animate-[float_3s_ease-in-out_infinite]">{item.icon}</div>
      </div>

      <div className="mt-6 text-5xl font-bold tracking-tight text-black sm:text-6xl">
        <Counter end={item.value} suffix={item.suffix} />
      </div>

      <p className="mx-auto mt-5 max-w-xs text-[15px] leading-9 text-slate-700">
        {item.label}
      </p>
    </div>
  );
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const tracks: TrackItem[] = [
    {
      name: "Web Design",
      icon: "💻",
      desc: "Learn how to build responsive and modern websites using practical tools, real projects, and guided coding support.",
    },
    {
      name: "Photography",
      icon: "📸",
      desc: "Master the art of visual storytelling, composition, lighting, and professional image capture for personal and commercial work.",
    },
    {
      name: "Videography",
      icon: "🎥",
      desc: "Develop hands-on skills in shooting, editing, and producing engaging video content that tells meaningful stories.",
    },
    {
      name: "Graphic Design",
      icon: "🎨",
      desc: "Create eye-catching brand visuals, social media graphics, flyers, and digital designs that communicate clearly and beautifully.",
    },
    {
      name: "Artificial Intelligence",
      icon: "🤖",
      desc: "Explore practical AI tools and workflows that improve creativity, productivity, problem-solving, and digital innovation.",
    },
  ];

  const galleryImages = [
    "/gallery/abuja-1.jpg",
    "/gallery/abuja-2.jpg",
    "/gallery/abuja-3.jpg",
    "/gallery/abuja-4.jpg",
    "/gallery/abuja-5.jpg",
    "/gallery/abuja-6.jpg",
    "/gallery/abuja-7.jpg",
    "/gallery/abuja-8.jpg",
    "/gallery/abuja-9.jpg",
    "/gallery/abuja-10.jpg",
    "/gallery/abuja-11.jpg",
    "/gallery/abuja-12.jpg",
    "/gallery/abuja-13.jpg",
    "/gallery/abuja-14.jpg",
    "/gallery/abuja-15.jpg",
    "/gallery/abuja-17.jpg",
  ];

  const testimonials: TestimonialItem[] = [
    {
      quote:
        "Before joining the training, I only knew how to record videos. Now, I can shoot, edit, and tell stories that connect with people. The training helped me see videography as an art and a career path.",
      name: "Yusuf Zuleihat",
      role: "Videographer",
      image: "/testimonials/yusuf-zuleihat.jpg",
    },
    {
      quote:
        "The photography classes taught me more than just how to take pictures, I learned how to capture emotions and moments. I’ve even started taking professional photos for clients!",
      name: "Musa Labiba",
      role: "Photographer",
      image: "/testimonials/musa-labiba.jpg",
    },
    {
      quote:
        "The web design training was a game changer for me. I went from knowing nothing about coding to creating my own portfolio website. The instructors were patient, and the hands-on projects boosted me.",
      name: "Joanna Odukoya",
      role: "Web Designer",
      image: "/testimonials/joanna-odukoya.jpg",
    },
    {
      quote:
        "This program opened my eyes to the power of creativity. I learned how to turn ideas into stunning visuals, and now I confidently design brand identities and social media content.",
      name: "Linda Isharah",
      role: "Graphic Designer",
      image: "/testimonials/linda-isharah.jpg",
    },
  ];

  const stats: StatItem[] = [
    {
      value: 180000,
      suffix: "+",
      label:
        "Number of girls trained across Nigeria’s 36 states and the Federal Capital Territory",
      icon: <Globe className="h-8 w-8 text-green-700" />,
    },
    {
      value: 7200,
      suffix: "+",
      label:
        "Number of Girls Re-enrolled After Dropping Out of School, Giving Them a Second Chance at Education",
      icon: <School className="h-8 w-8 text-green-700" />,
    },
    {
      value: 2000,
      suffix: "+",
      label:
        "Number of Young Women Introduced to STEM Opportunities and Provided Intensive Training in Fields such as Cybersecurity, Software Development, and Data Analytics",
      icon: <Monitor className="h-8 w-8 text-green-700" />,
    },
    {
      value: 100,
      suffix: "+",
      label: "Number of Girls Trained in Digital Skills",
      icon: <Code2 className="h-8 w-8 text-green-700" />,
    },
  ];

  const faqs = [
    {
      q: "Who can apply for the training?",
      a: "The training is open to students and young people who are interested in building practical digital skills through the G4EP Project RISE initiative.",
    },
    {
      q: "Is the training free?",
      a: "Yes. The program is designed as an empowerment initiative and selected participants are trained at no cost.",
    },
    {
      q: "How do I register?",
      a: "Click any Register button on this page and complete the official application form through the provided JotForm link.",
    },
    {
      q: "Will participants receive certificates?",
      a: "Yes. Participants who complete the training requirements successfully can receive certificates through the portal.",
    },
  ];

  return (
    <>
      <main className="min-h-screen bg-white text-slate-900">
        <style jsx global>{`
          @keyframes float {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-8px);
            }
          }
        `}</style>

        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/landing/hero-bg.jpg"
              alt="G4EP Project RISE training participants"
              fill
              priority
              className="object-cover"
            />
          </div>

          <div className="absolute inset-0 bg-green-950/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-950/70 via-green-900/35 to-green-800/45" />

          <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="max-w-3xl text-white">
                <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
                  Akwa Ibom Digital Skills Training
                </p>

                <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  G4EP Project RISE
                  <br />
                  Command Center
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-green-50/90 sm:text-lg">
                  A unified training portal for learning, project submission,
                  student progress tracking, attendance, and certification
                  across Web Design, Photography, Videography, Graphic Design,
                  and AI.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href="https://form.jotform.com/252385187138565"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white px-6 py-3 font-semibold text-green-900 transition hover:bg-green-50"
                  >
                    Register Now
                  </a>

                  <Link
                    href="#tracks"
                    className="rounded-full border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                  >
                    Explore Tracks
                  </Link>
                </div>
              </div>

              <div className="justify-self-end rounded-[2rem] border border-white/15 bg-white/[0.01] p-5 shadow-2xl backdrop-blur-2xl sm:p-6 lg:max-w-[520px]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
                  Program Focus
                </p>

                <h2 className="mt-3 text-3xl font-bold leading-tight text-white">
                  Training for impact, creativity, and career growth
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {tracks.map((track) => (
                    <div
                      key={track.name}
                      className="rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-4 text-white"
                    >
                      <p className="font-semibold">{track.name}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-green-50/90">
                  This portal supports the full training journey from onboarding
                  to resources, assignments, submissions, attendance, and
                  certificate readiness.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            {/* LEFT SIDE TEXT */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
                About the Program
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                RISE Project (Renewed Hope for Inclusion, Support, and Empowerment)
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600">
                The RISE Project is a youth and student empowerment initiative led by
                the Office of the Senior Special Assistant to the President on Student
                Engagement, under the leadership of Hon. Comrade Sunday Asefon.
              </p>

              <p className="mt-4 text-base leading-8 text-slate-600">
                As part of the Renewed Hope Agenda of President Bola Ahmed Tinubu, the
                project is focused on bridging the digital divide and promoting economic
                self-reliance among Nigerian students, with special attention to the
                girl child.
              </p>

              <p className="mt-4 text-base leading-8 text-slate-600">
                Through the program, participants are equipped with practical digital
                skills such as web design, photography, cinematography, and mobile
                technology, while also being guided in leadership, critical thinking,
                and real-world problem solving.
              </p>
            </div>

            {/* RIGHT SIDE BIG BOXES */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-green-100 bg-green-50 p-8 shadow-sm">
                <h3 className="text-2xl font-semibold text-green-900">
                  Digital Skills
                </h3>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  Hands-on training in web design, photography, videography, and mobile
                  technology.
                </p>
              </div>

              <div className="rounded-[2rem] border border-green-100 bg-white p-8 shadow-sm">
                <h3 className="text-2xl font-semibold text-green-900">
                  Inclusion & Empowerment
                </h3>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  Focused on ensuring the girl child and vulnerable students are not
                  left behind.
                </p>
              </div>

              <div className="rounded-[2rem] border border-green-100 bg-white p-8 shadow-sm">
                <h3 className="text-2xl font-semibold text-green-900">
                  Leadership Growth
                </h3>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  Mentorship in leadership, critical thinking, and problem-solving
                  skills.
                </p>
              </div>

              <div className="rounded-[2rem] border border-green-100 bg-green-50 p-8 shadow-sm">
                <h3 className="text-2xl font-semibold text-green-900">
                  Academic Excellence
                </h3>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  Recognition and support for outstanding academic performance.
                </p>
              </div>
            </div>

            {/* FULL WIDTH FOUR CARDS */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[2rem] border border-green-100 bg-green-50 p-8 shadow-sm">
                  <h3 className="text-2xl font-semibold text-green-900">
                    Student Workspace
                  </h3>
                  <p className="mt-4 text-base leading-8 text-slate-600">
                    Access resources, submit projects, and track progress.
                  </p>
                </div>

                <div className="rounded-[2rem] border border-green-100 bg-white p-8 shadow-sm">
                  <h3 className="text-2xl font-semibold text-green-900">
                    Teacher Management
                  </h3>
                  <p className="mt-4 text-base leading-8 text-slate-600">
                    Upload materials, assign tasks, and review submissions.
                  </p>
                </div>

                <div className="rounded-[2rem] border border-green-100 bg-white p-8 shadow-sm">
                  <h3 className="text-2xl font-semibold text-green-900">
                    Admin Oversight
                  </h3>
                  <p className="mt-4 text-base leading-8 text-slate-600">
                    Manage users, attendance, and training activities.
                  </p>
                </div>

                <div className="rounded-[2rem] border border-green-100 bg-green-50 p-8 shadow-sm">
                  <h3 className="text-2xl font-semibold text-green-900">
                    Practical Learning
                  </h3>
                  <p className="mt-4 text-base leading-8 text-slate-600">
                    Hands-on projects and real-world skill development.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="bg-[#f7faf7] py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((item, index) => (
                <StatCard key={index} item={item} />
              ))}
            </div>
          </div>
        </section>

        {/* TRACKS */}
        <section id="tracks" className="bg-green-50 py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
              Training Tracks
            </p>

            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              High-impact digital skill areas
            </h2>

            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
              {tracks.map((track) => (
                <div
                  key={track.name}
                  className="flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-green-100"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-2xl">
                    {track.icon}
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900">
                    {track.name}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {track.desc}
                  </p>

                  <a
                    href="https://form.jotform.com/252385187138565"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto pt-5"
                  >
                    <span className="inline-block rounded-full bg-green-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800">
                      Register
                    </span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LEADERSHIP */}
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
              Leadership & Vision
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              The driving force behind G4EP Project RISE
            </h2>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border border-green-100 bg-green-50">
                  <Image
                    src="/leaders/sunday-asefon.jpg"
                    alt="Sunday Asefon"
                    fill
                    className="object-cover"
                  />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Sunday Asefon
                  </h3>
                  <p className="text-sm font-medium text-green-700">
                    Senior Special Assistant to President Bola Ahmed Tinubu on
                    Student Engagement
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4 text-sm leading-8 text-slate-600">
                <p>
                  Sunday Asefon is the primary visionary behind the G4EP
                  initiative and the driving force behind its broader mission of
                  student engagement, empowerment, and inclusion.
                </p>

                <p>
                  Through his office, G4EP was established as a comprehensive
                  platform created to address major challenges affecting the
                  Nigerian girl-child and female students.
                </p>

                <p>
                  Under the G4EP umbrella, he launched Project RISE, a flagship
                  initiative designed to create one of the largest convergences
                  of female students in Nigeria for mentorship, advocacy, and
                  digital empowerment.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border border-green-100 bg-green-50">
                  <Image
                    src="/leaders/judith-ogbara.jpg"
                    alt="Hon. Dr. Judith Mayen Etuk-Ogbara"
                    fill
                    className="object-cover"
                  />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Hon. Dr. Judith Mayen Etuk-Ogbara
                  </h3>
                  <p className="text-sm font-medium text-green-700">
                    Chairman, Advisory Board, G4EP
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4 text-sm leading-8 text-slate-600">
                <p>
                  Hon. Dr. Judith Mayen Etuk-Ogbara serves as the Chairman of
                  the Advisory Board for G4EP and plays a leading role in the
                  strategic direction of the initiative.
                </p>

                <p>
                  She is a key force behind the RISE Project, helping shape its
                  digital skills training focus across Photography,
                  Cinematography, Web Design, and Graphic Design.
                </p>

                <p>
                  Her work within G4EP emphasizes mentorship, advocacy,
                  educational access, financial literacy, and entrepreneurial
                  development, all aimed at helping young girls rise above
                  limitations and compete confidently in today’s digital
                  economy.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* THROWBACK GALLERY */}
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
                Abuja Throwback
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                Moments from previous training sessions
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                A look back at inspiring moments from the Abuja training,
                highlighting participation, community, learning, and impact.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {galleryImages.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setSelectedImage(image)}
                className="group overflow-hidden rounded-[1.75rem] border border-green-100 bg-white text-left shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[4/4] w-full overflow-hidden">
                  <Image
                    src={image}
                    alt={`Abuja training throwback ${index + 1}`}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>

              </button>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="bg-[#f7faf7] py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="text-center">
              <h2 className="text-4xl font-semibold uppercase tracking-tight text-black sm:text-5xl">
                What Our Participants Say
              </h2>
              <div className="mx-auto mt-4 h-1 w-40 bg-green-700 sm:w-72" />
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
              {testimonials.map((item) => (
                <div
                  key={item.name}
                  className="rounded-[1.75rem] border border-green-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-[18px] leading-9 text-black">
                    {item.quote}
                  </p>

                  <div className="mt-10 flex items-center gap-4">
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border border-green-200">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-black">
                        {item.name}
                      </h3>
                      <p className="text-xl text-slate-400">{item.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-6 lg:px-10">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
                FAQ
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="mt-10 space-y-4">
              {faqs.map((item, i) => (
                <details
                  key={i}
                  className="rounded-2xl border border-green-100 bg-green-50 p-5"
                >
                  <summary className="cursor-pointer font-semibold text-green-900">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <div className="rounded-[2rem] bg-green-900 px-8 py-12 text-center text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-100">
              Ready to Join?
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Start your digital skills journey with G4EP
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-green-50/90">
              Register through the official form and get ready to access the
              training portal, submit projects, and track your progress.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="https://form.jotform.com/252385187138565"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-full bg-white px-6 py-3 font-semibold text-green-900 transition hover:bg-green-50"
              >
                Open Registration Form
              </a>

              <Link
                href="/login"
                className="inline-flex rounded-full border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Login to Portal
              </Link>
            </div>
          </div>
        </section>

        {/* IMAGE MODAL */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="relative w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900"
              >
                Close
              </button>

              <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-white">
                <Image
                  src={selectedImage}
                  alt="Expanded gallery view"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <PortalFooter />
    </>
  );
}