const skills = [
  {
    name: "Web Development",
    category: "Technology",
    learners: 124,
  },
  {
    name: "Graphic Design",
    category: "Design",
    learners: 98,
  },
  {
    name: "Photography",
    category: "Creative",
    learners: 76,
  },
  {
    name: "Digital Marketing",
    category: "Business",
    learners: 64,
  },
  {
    name: "Video Editing",
    category: "Creative",
    learners: 52,
  },
  {
    name: "Music",
    category: "Arts",
    learners: 47,
  },
];

function Discover() {
  return (
    <section id="discover" className="bg-[#fffdf2] py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-6">

        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">

          <span className="inline-block px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
            Discover
          </span>

          <h2 className="mt-5 text-4xl md:text-5xl font-bold text-[#062f2f]">
            Discover skills worth sharing
          </h2>

          <p className="mt-5 text-lg text-gray-600 leading-relaxed">
            Find skills you want to learn and people who are ready to
            exchange knowledge with you.
          </p>

        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mt-10">

          <div className="flex items-center bg-white border border-[#d9e7df] rounded-lg px-5 py-3 focus-within:ring-2 focus-within:ring-amber-500">

            <span className="text-gray-400 text-xl mr-3">
              🔍
            </span>

            <input
              type="text"
              placeholder="Search for a skill..."
              className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />

          </div>

        </div>

        {/* Skill Cards */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {skills.map((skill) => (
            <div
              key={skill.name}
              className="group p-6 bg-white border border-[#d9e7df] rounded-lg hover:border-amber-300 hover:shadow-lg transition duration-300 cursor-pointer"
            >

              <div className="flex items-start justify-between">

                <div>
                  <span className="text-sm text-amber-600 font-medium">
                    {skill.category}
                  </span>

                  <h3 className="mt-2 text-xl font-bold text-[#062f2f]">
                    {skill.name}
                  </h3>
                </div>

                <span className="text-gray-300 group-hover:text-amber-500 transition">
                  →
                </span>

              </div>

              <p className="mt-5 text-sm text-gray-500">
                {skill.learners} people interested
              </p>

            </div>
          ))}

        </div>

        {/* View More */}
        <div className="text-center mt-10">

          <button className="px-6 py-3 border border-[#9ac5b8] rounded-lg text-[#062f2f] font-medium hover:border-amber-500 hover:text-amber-600 transition">
            Explore All Skills
          </button>

        </div>

      </div>
    </section>
  );
}

export default Discover;