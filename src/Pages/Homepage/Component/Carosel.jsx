import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";
import "./stylec.css";

import { Pagination } from "swiper/modules";
import { TTrend_templateService } from "./Services/TTrend_templateService";
import { useNavigate } from "react-router";
import { useGeneralData } from "../../.././Context/GeneralContext";
export default function Carosel() {
  const [slides, setSlides] = useState([]);
  const [selectedTemp, setSelectedTemp] = useState(null);
  const { selType, setSelType } = useGeneralData();
  const navigate = useNavigate();
  useEffect(() => {
    const loadTrending = async () => {
      const data = await TTrend_templateService();
      setSlides(data);
    };

    loadTrending();
  }, []);
  const handleImagePress = (item) => {
    setSelectedTemp(item);
    const selttype = {
      id: item.id,
      type: item.type,
      serial: item.serial,
      ShowCaseForm: item.ShowCaseForm,
    };
    setSelType(selttype);
    navigate("/alltemp");
  };

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
              onClick={() => handleImagePress(item)}
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
