import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";
import "./stylec.css";

import { Pagination } from "swiper/modules";
import { TTrend_templateService } from "./Services/TTrend_templateService";

export default function Carosel() {
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    const loadTrending = async () => {
      const data = await TTrend_templateService();
      setSlides(data);
    };

    loadTrending();
  }, []);

  console.log(slides);

  return (
    <div className="flex mt-1 justify-center items-center p-1 lg:h-[300px] h-[200px] w-full ">
      <Swiper
        pagination={{ dynamicBullets: true }}
        modules={[Pagination]}
        className="mySwiper"
      >
        {slides?.map((item) => (
          <SwiperSlide key={item.id}>
            <img
              src={item.image}
              alt="trending"
              className="w-full h-full object-cover rounded-xl"
              loading="lazy"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
