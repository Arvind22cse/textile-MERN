const AboutUs = () => (
  <div id="about">
    <section className="p-6 bg-gray-100 flex justify-center items-center">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden md:flex justify-between">
        <div className="p-8 md:w-1/2">
          <h2 className="text-3xl font-extrabold mb-4">About Us</h2>
          <p className="mb-6 text-justify">
            Kumar Textiles is a small-scale industry located in Pallipalayam, specializing in high-quality shirt fabrics. The company focuses on providing a wide range of textile options for shirt manufacturing. With a reputation for quality and reliability, it caters to both local and regional markets. Kumar Textiles is committed to delivering durable and stylish fabrics to its customers.
          </p>
          <a href="#" className="text-blue-500 hover:underline">
            Learn more about us →
          </a>
        </div>
        <div className="md:w-1/2">
          <img className="object-cover w-full h-full" src="https://th-i.thgim.com/public/migration_catalog/article12580236.ece/alternates/LANDSCAPE_1200/TY26HANDLOOM1" alt="Office" />
        </div>
      </div>
    </section>
  </div>
);

export default AboutUs;
