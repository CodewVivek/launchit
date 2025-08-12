import React from "react";

const Aboutus = () => {
  return (
    <div className="mt-20 px-6 py-12 max-w-5xl mx-auto text-gray-800">
      {/* Title */}
      <h1 className="text-4xl font-bold text-center mb-10">About Us</h1>

      {/* Introduction */}
      <section className="mb-10">
        <p className="text-lg leading-relaxed">
          <span className="font-semibold text-primary-500">Skypher</span> is a
          platform built to connect innovative startups with the resources,
          mentorship, and funding they need to succeed. Our community is
          designed to foster collaboration between creators, builders, and
          investors.
        </p>
      </section>

      {/* Mission */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
        <p className="text-base leading-relaxed">
          To empower the next generation of entrepreneurs by giving them the
          tools and visibility to turn ideas into impactful ventures. We aim to
          break barriers and democratize access to innovation and growth.
        </p>
      </section>

      {/* Vision */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Our Vision</h2>
        <p className="text-base leading-relaxed">
          To become the most trusted launchpad for startups worldwide — a place
          where innovation meets opportunity, and ideas become global solutions.
        </p>
      </section>

      {/* Core Values */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Core Values</h2>
        <ul className="list-disc list-inside space-y-2 text-base">
          <li>
            <span className="font-medium">Transparency</span> – We believe in
            open and honest communication with our users and partners.
          </li>
          <li>
            <span className="font-medium">Innovation</span> – We support bold
            ideas and new ways of thinking.
          </li>
          <li>
            <span className="font-medium">Community</span> – We’re stronger
            together. Our network is our greatest strength.
          </li>
          <li>
            <span className="font-medium">Empowerment</span> – Every founder
            deserves a chance, no matter where they come from.
          </li>
        </ul>
      </section>

      {/* Call to Action */}
      <section className="mt-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">Join the Movement</h2>
        <p className="text-base mb-6">
          Whether you're a founder with a dream, an investor with a vision, or
          someone who just loves innovation — you're welcome at Skypher.
        </p>
        <a
          href="/register"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
        >
          Get Started
        </a>
      </section>
    </div>
  );
};

export default Aboutus;
