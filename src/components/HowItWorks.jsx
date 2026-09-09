function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create Your Profile",
      description:
        "Tell the community who you are, where you're from, and what skills you have.",
    },
    {
      number: "02",
      title: "Add Your Skills",
      description:
        "Choose the skills you can teach and the skills you want to learn.",
    },
    {
      number: "03",
      title: "Find Your Match",
      description:
        "Discover people who have the skills you want and are interested in what you can teach.",
    },
    {
      number: "04",
      title: "Exchange & Grow",
      description:
        "Connect with your match, share knowledge, learn together, and grow your skills.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="bg-white py-20 md:py-24"
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">

          <span className="inline-block px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
            How It Works
          </span>

          <h2 className="mt-5 text-4xl md:text-5xl font-bold text-[#062f2f]">
            Learn and teach in four simple steps
          </h2>

          <p className="mt-5 text-lg text-gray-600 leading-relaxed">
            Skill Exchanger makes it easy to turn the skills you already
            have into opportunities to learn something new.
          </p>

        </div>

        {/* Steps */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {steps.map((step) => (
            <div
              key={step.number}
              className="relative p-8 rounded-lg border border-[#d9e7df] bg-[#fffdf2] hover:bg-white hover:shadow-lg transition duration-300"
            >

              {/* Number */}
              <div className="text-5xl font-bold text-amber-200">
                {step.number}
              </div>

              {/* Title */}
              <h3 className="mt-5 text-xl font-bold text-[#062f2f]">
                {step.title}
              </h3>

              {/* Description */}
              <p className="mt-3 text-gray-600 leading-relaxed">
                {step.description}
              </p>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default HowItWorks;