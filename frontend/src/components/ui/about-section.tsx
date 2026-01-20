"use client";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { ArrowRight, Instagram, Youtube, Music } from "lucide-react";
import { useRef } from "react";

interface AboutSectionProps {
  language?: 'en' | 'id';
}

export default function AboutSection({ language = 'en' }: AboutSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  
  const content = {
    en: {
      whoAm: "WHO WE ARE",
      title: "Building Excellence in Badminton Community",
      description1: "DLOB started with a simple vision: to revolutionize how badminton communities are organized and managed. Through innovative technology, we've made it easier for players to focus on what matters most - playing great badminton.",
      description2: "From attendance tracking to match management, we handle the complexity so your community can thrive. With transparent payments and AI-powered insights, DLOB is the future of community badminton.",
      brandName: "DLOB",
      tagline: "Community | Technology | Excellence",
      cta: "Learn more about us",
      callToAction: "Ready to join the best badminton community?",
    },
    id: {
      whoAm: "SIAPA KAMI",
      title: "Membangun Keunggulan dalam Komunitas Bulu Tangkis",
      description1: "DLOB dimulai dengan visi sederhana: merevolusi cara komunitas bulu tangkis diorganisir dan dikelola. Melalui teknologi inovatif, kami membuat lebih mudah bagi pemain untuk fokus pada hal yang paling penting - bermain bulu tangkis yang hebat.",
      description2: "Dari pelacakan kehadiran hingga manajemen pertandingan, kami menangani kompleksitasnya sehingga komunitas Anda dapat berkembang. Dengan pembayaran transparan dan wawasan bertenaga AI, DLOB adalah masa depan komunitas bulu tangkis.",
      brandName: "DLOB",
      tagline: "Komunitas | Teknologi | Keunggulan",
      cta: "Pelajari lebih lanjut tentang kami",
      callToAction: "Siap bergabung dengan komunitas bulu tangkis terbaik?",
    }
  };

  const t = content[language as keyof typeof content];

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.4,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  const scaleVariants = {
    visible: (i: number) => ({
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.4,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      opacity: 0,
    },
  };

  return (
    <section className="py-8 px-4 bg-[#f9f9f9]" ref={heroRef}>
      <div className="max-w-6xl mx-auto">
        <div className="relative">
          {/* Header with social icons */}
          <div className="flex justify-between items-center mb-8 w-[85%] absolute lg:top-4 md:top-0 sm:-top-2 -top-3 z-10">
            <div className="flex items-center gap-2 text-xl">
              <span className="text-pink-600 animate-spin">✱</span>
              <TimelineContent
                as="span"
                animationNum={0}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="text-sm font-medium text-gray-600"
              >
                {t.whoAm}
              </TimelineContent>
            </div>
            <div className="flex gap-4">
              <TimelineContent
                as="a"
                animationNum={0}
                timelineRef={heroRef}
                customVariants={revealVariants}
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="md:w-8 md:h-8 sm:w-6 w-5 sm:h-6 h-5 border border-gray-200 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <Instagram className="w-4 h-4 text-gray-700" />
              </TimelineContent>
              <TimelineContent
                as="a"
                animationNum={1}
                timelineRef={heroRef}
                customVariants={revealVariants}
                href="https://www.tiktok.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="md:w-8 md:h-8 sm:w-6 w-5 sm:h-6 h-5 border border-gray-200 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <Music className="w-4 h-4 text-gray-700" />
              </TimelineContent>
              <TimelineContent
                as="a"
                animationNum={2}
                timelineRef={heroRef}
                customVariants={revealVariants}
                href="https://www.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="md:w-8 md:h-8 sm:w-6 w-5 sm:h-6 h-5 border border-gray-200 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <Youtube className="w-4 h-4 text-gray-700" />
              </TimelineContent>
            </div>
          </div>

          {/* Clipped Image Section */}
          <TimelineContent
            as="figure"
            animationNum={4}
            timelineRef={heroRef}
            customVariants={scaleVariants}
            className="relative group"
          >
            <svg
              className="w-full"
              width={"100%"}
              height={"100%"}
              viewBox="0 0 100 40"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <clipPath
                  id="clip-inverted"
                  clipPathUnits={"objectBoundingBox"}
                >
                  <path
                    d="M0.0998072 1H0.422076H0.749756C0.767072 1 0.774207 0.961783 0.77561 0.942675V0.807325C0.777053 0.743631 0.791844 0.731953 0.799059 0.734076H0.969813C0.996268 0.730255 1.00088 0.693206 0.999875 0.675159V0.0700637C0.999875 0.0254777 0.985045 0.00477707 0.977629 0H0.902473C0.854975 0 0.890448 0.138535 0.850165 0.138535H0.0204424C0.00408849 0.142357 0 0.180467 0 0.199045V0.410828C0 0.449045 0.0136283 0.46603 0.0204424 0.469745H0.0523086C0.0696245 0.471019 0.0735527 0.497877 0.0733523 0.511146V0.915605C0.0723903 0.983121 0.090588 1 0.0998072 1Z"
                    fill="#D9D9D9"
                  />
                </clipPath>
              </defs>
              <image
                clipPath="url(#clip-inverted)"
                preserveAspectRatio="xMidYMid slice"
                width={"100%"}
                height={"100%"}
                xlinkHref="/images/potrait/IMG_7627.JPG"
              />
            </svg>
          </TimelineContent>

          {/* Stats */}
          <div className="flex flex-wrap lg:justify-start justify-between items-center py-3 text-sm">
            <TimelineContent
              as="div"
              animationNum={5}
              timelineRef={heroRef}
              customVariants={revealVariants}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2 mb-2 sm:text-base text-xs">
                <span className="text-pink-600 font-bold">50+</span>
                <span className="text-gray-600">{language === 'en' ? 'active members' : 'anggota aktif'}</span>
                <span className="text-gray-300">|</span>
              </div>
              <div className="flex items-center gap-2 mb-2 sm:text-base text-xs">
                <span className="text-pink-600 font-bold">100+</span>
                <span className="text-gray-600">{language === 'en' ? 'matches' : 'pertandingan'}</span>
              </div>
            </TimelineContent>
            <div className="lg:absolute right-0 bottom-16 flex lg:flex-col flex-row-reverse lg:gap-0 gap-4">
              <TimelineContent
                as="div"
                animationNum={6}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="flex lg:text-4xl sm:text-3xl text-2xl items-center gap-2 mb-2"
              >
                <span className="text-pink-600 font-semibold">5+</span>
                <span className="text-gray-600 uppercase">{language === 'en' ? 'years' : 'tahun'}</span>
              </TimelineContent>
              <TimelineContent
                as="div"
                animationNum={7}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="flex items-center gap-2 mb-2 sm:text-base text-xs"
              >
                <span className="text-pink-600 font-bold">{language === 'en' ? 'AI' : 'AI'}</span>
                <span className="text-gray-600">{language === 'en' ? 'powered insights' : 'wawasan bertenaga'}</span>
                <span className="text-gray-300 lg:hidden block">|</span>
              </TimelineContent>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h1 className="sm:text-4xl md:text-5xl text-2xl !leading-[110%] font-semibold text-gray-900 mb-8">
              <VerticalCutReveal
                splitBy="words"
                staggerDuration={0.1}
                staggerFrom="first"
                reverse={false}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 30,
                  delay: 0.3,
                }}
              >
                {t.title}
              </VerticalCutReveal>
            </h1>

            <TimelineContent
              as="div"
              animationNum={8}
              timelineRef={heroRef}
              customVariants={revealVariants}
              className="grid md:grid-cols-2 gap-8 text-gray-600"
            >
              <TimelineContent
                as="div"
                animationNum={9}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="sm:text-base text-xs"
              >
                <p className="leading-relaxed text-justify">
                  {t.description1}
                </p>
              </TimelineContent>
              <TimelineContent
                as="div"
                animationNum={10}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="sm:text-base text-xs"
              >
                <p className="leading-relaxed text-justify">
                  {t.description2}
                </p>
              </TimelineContent>
            </TimelineContent>
          </div>

          {/* Right Column - Brand Info */}
          <div className="md:col-span-1">
            <div className="text-right">
              <TimelineContent
                as="div"
                animationNum={11}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="text-pink-600 text-2xl font-bold mb-2"
              >
                {t.brandName}
              </TimelineContent>
              <TimelineContent
                as="div"
                animationNum={12}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="text-gray-600 text-sm mb-8"
              >
                {t.tagline}
              </TimelineContent>

              <TimelineContent
                as="div"
                animationNum={13}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="mb-6"
              >
                <p className="text-gray-900 font-medium mb-4">
                  {t.callToAction}
                </p>
              </TimelineContent>

              <TimelineContent
                as="a"
                href="/about"
                animationNum={14}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="bg-gradient-to-r from-pink-600 to-yellow-500 hover:shadow-lg shadow-lg border-0 flex w-fit ml-auto gap-2 hover:gap-4 transition-all duration-300 ease-in-out text-white px-5 py-3 rounded-lg cursor-pointer font-semibold text-sm"
              >
                {t.cta} <ArrowRight className="w-4 h-4" />
              </TimelineContent>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
