import React from "react";

const Suggestions = () => (
  <div className="max-w-2xl mx-auto py-12 px-4">
    <h1 className="text-2xl font-bold mb-6 text-center">
      Suggestions / Feedback
    </h1>
    <div className="bg-white rounded-xl shadow p-4">
      <iframe
        src="https://forms.gle/RNhhKNFfoCNnHJPv9"
        width="100%"
        height="700"
        frameBorder="0"
        marginHeight="0"
        marginWidth="0"
        title="Suggestions Form"
        className="w-full rounded"
        allowFullScreen
      >
        Loading…
      </iframe>
    </div>
  </div>
);

export default Suggestions;
