import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap,
  faPeopleGroup,
  faLightbulb,
} from "@fortawesome/free-solid-svg-icons";

function About() {
  return (
    <section
      id="about"
      className="bg-[#fffdf2] py-20 md:py-24 scroll-mt-20"
    >
      <div className="max-w-5xl mx-auto px-6 text-center">

        <span className="inline-block px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
          About Us
        </span>

        <h2 className="mt-5 text-4xl md:text-5xl font-bold text-[#062f2f]">
          Everyone has something to teach
        </h2>

        <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
          Skill Exchanger is a platform that connects people who want
          to learn with people who have skills to share.
        </p>

        <p className="mt-5 text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
          Instead of simply paying for courses, people can exchange
          knowledge, build meaningful connections, and grow together.
        </p>

        {/* Values */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">

          <div className="p-6 rounded-lg bg-white border border-[#d9e7df]">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faGraduationCap} />
            </div>

            <h3 className="mt-4 font-bold text-[#062f2f]">
              Learn
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Discover knowledge from people who have the skills you want.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-white border border-[#d9e7df]">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faPeopleGroup} />
            </div>

            <h3 className="mt-4 font-bold text-[#062f2f]">
              Connect
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Meet people with complementary skills and interests.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-white border border-[#d9e7df]">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faLightbulb} />
            </div>

            <h3 className="mt-4 font-bold text-[#062f2f]">
              Grow
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Exchange knowledge and continuously develop your abilities.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}

export default About;