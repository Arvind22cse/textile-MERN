import React from 'react';

function Contactus() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 px-8 lg:px-20 py-16 bg-white">
      {/* Contact Form */}
      <form className="space-y-6 shadow-lg p-8 rounded-2xl border border-gray-200">
        <h2 className="text-2xl font-semibold text-green-700 mb-4">Get In Touch 😊</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Name *" className="input" required />
          <input type="email" placeholder="Email *" className="input" required />
          <input type="tel" placeholder="Mobile *" className="input" required />
          <input type="text" placeholder="City *" className="input" />
          <input type="text" placeholder="State *" className="input" />
          <input type="text" placeholder="Country *" className="input" />
        </div>
        <textarea rows="4" placeholder="Your Comment" className="input w-full resize-none" />
        
        <div className="flex items-center gap-2">
          <input type="checkbox" />
          <label className="text-sm">I’m not a robot</label>
          {/* reCAPTCHA widget goes here */}
        </div>

        <div className="flex gap-4">
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl transition-all shadow-md">
            SEND MESSAGE
          </button>
          <button type="reset" className="border px-6 py-2 rounded-xl hover:bg-gray-100">Clear</button>
        </div>
      </form>

      {/* You can add an image or map in this second column if needed */}
      <div className="flex justify-center items-center">
        <img
          src="https://img.freepik.com/free-vector/contact-us-concept-landing-page_52683-12860.jpg?w=1060&t=st=1713079461~exp=1713080061~hmac=253bb245683f79fdbf9d27815cd72e0d90cf2c9eb5cb0e0ad204248b1b40a0e6"
          alt="Contact Illustration"
          className="rounded-2xl shadow-md"
        />
      </div>
    </div>
  );
}

export default Contactus;
