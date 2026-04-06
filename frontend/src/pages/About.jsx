import React from "react";

const About = () => {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-slate-100 md:text-5xl">
          About Campus Lost & Found
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-400 md:text-xl">
          Campus Lost & Found is your one-stop platform to report, find, or post lost and found items in your campus.
        </p>
      </div>

      {/* Mission Section */}
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-sky-400">Our Mission</h2>
          <p className="text-base text-slate-300 md:text-lg">
            We aim to create a safe and reliable environment for students to recover lost items and return found items to their rightful owners.
          </p>
        </div>
        <img
          src="https://images.unsplash.com/photo-1581091870629-4c0b2b07d5ff?auto=format&fit=crop&w=800&q=80"
          alt="Mission"
          className="w-full rounded-xl shadow-lg shadow-black/40 ring-1 ring-deep-border"
        />
      </div>

      {/* Values Section */}
      <div className="mt-16 grid items-center gap-12 md:grid-cols-2">
        <img
          src="https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=800&q=80"
          alt="Values"
          className="w-full rounded-xl shadow-lg shadow-black/40 ring-1 ring-deep-border md:order-first"
        />
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-sky-400">Our Values</h2>
          <ul className="list-inside list-disc space-y-2 text-base text-slate-300 md:text-lg">
            <li>Trust & Transparency</li>
            <li>Quick & Reliable Service</li>
            <li>Community Engagement</li>
            <li>User-Friendly Experience</li>
          </ul>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-16 text-center">
        <h3 className="mb-4 text-2xl font-semibold text-slate-100">Join Us Today</h3>
        <p className="mb-6 text-slate-400">
          Be part of a community that helps recover lost items and ensures nothing gets lost forever.
        </p>
        <button className="rounded-xl bg-gradient-accent px-8 py-3 font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-gradient-accent-hover hover:shadow-xl">
          Get Started
        </button>
      </div>
    </div>
  );
};

export default About;
