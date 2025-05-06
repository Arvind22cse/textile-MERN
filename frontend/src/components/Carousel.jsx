import React from 'react';
import { Carousel as ResponsiveCarousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import img from './kumar1.jpg';
import img1 from './kumar3.jpg';
import img2 from './kumar2.jpg';
import img3 from './kumar4.jpg';
import vid from "../assets/vid.mp4";

const imageStyle = {
  width: '90%',
  height: '300px',
  objectFit: 'cover',
  borderRadius: '10px',
};

const Carousel = () => (
  <ResponsiveCarousel autoPlay infiniteLoop showThumbs={false} className="mt-4">
    <div className='flex justify-center items-center'>
      <video
        src={vid}
        loop
        autoPlay
        muted
        playsInline
        style={{ width: '90%', height: '300px', borderRadius: '10px', objectFit: 'cover' }}
        className=''
      />
    </div>
    <div>
      <img src={img} alt="Product 1" style={imageStyle} />
    </div>
    <div>
      <img src={img3} alt="Product 2" style={imageStyle} />
    </div>
    <div>
      <img src={img2} alt="Product 3" style={imageStyle} />
    </div>
    <div>
      <img
        src="https://img.freepik.com/free-photo/pile-textiles-background_53876-88751.jpg?semt=ais_hybrid"
        alt="Product 4"
        style={imageStyle}
      />
    </div>
  </ResponsiveCarousel>
);

export default Carousel;
