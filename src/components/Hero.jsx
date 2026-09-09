import heroImage from "../assets/images/imgg.jpg";

function Hero() {
  return (
    <section className="relative min-h-[560px] overflow-hidden">

      {/* Background Image */}
      <img
        src={heroImage}
        alt="People sharing and learning skills"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[#062f2f]/65"></div>

      {/* Hero Content */}
      <div className="relative z-10 min-h-[560px] flex items-center">

        <div className="max-w-7xl mx-auto px-6 py-16 w-full">

          <div className="max-w-3xl">

            {/* Label */}
            <div className="inline-block px-4 py-2 bg-[#0f766e]/90 text-white rounded-full text-sm font-medium mb-6">
              Learn • Teach • Connect
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight">
              Exchange skills.
              <br />

              <span className="text-amber-400">
                Grow together.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 text-lg md:text-xl text-gray-200 max-w-2xl leading-relaxed">
              Share the skills you know, discover what you want to learn,
              and connect with people who can help you grow.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">

              <button className="px-7 py-3.5 bg-[#0f766e] text-white rounded-lg font-semibold hover:bg-[#0b5d58] transition duration-300">
                Find Your Skill Match
              </button>

              <button className="px-7 py-3.5 bg-amber-500/90 backdrop-blur-sm border border-amber-300/60 text-white rounded-lg font-semibold hover:bg-amber-600 transition duration-300">
                Explore Skills
              </button>

            </div>

          </div>

        </div>
      </div>

    </section>
  );
}

export default Hero;