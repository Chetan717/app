import { useState, useRef, useEffect } from "react";
import { Festival_template } from "./Services/Festival_template";
import { useGeneralData } from "../../.././Context/GeneralContext";
import "./stylec.css";
export default function Festival() {
  const sliderRef = useRef(null);
  const dates = generateDates();
  const { theme, toggleTheme, theame_color } = useGeneralData();
  const [selectedDate, setSelectedDate] = useState(dates[0].iso);
  const [festivaltempdata, setFestivalTempData] = useState([]);

  useEffect(() => {
    loadFestival(selectedDate);
  }, [selectedDate]);

  const loadFestival = async (date) => {
    const data = await Festival_template(date);
    setFestivalTempData(data);
  };

  const scroll = (dir) => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: dir * 220, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col  gap-2 justify-center items-center  w-full">
      {/* DATE SELECTOR */}

      <div className="slider-track flex  lg:gap-5 gap-2 overflow-x-auto w-full px-1 py-1">
        {dates?.map((d) => (
          <button
            key={d.iso}
            onClick={() => setSelectedDate(d.iso)}
            className={`flex flex-col items-center px-1 py-1 rounded-lg min-w-[45px]
            ${selectedDate === d.iso ? `bg-[${theame_color}] text-white` : `bg-gray-200`}`}
          >
            <span
              className={
                selectedDate === d.iso
                  ? `text-[15px] text-white font-bold`
                  : theme === "dark"
                    ? `text-[15px] text-black font-bold`
                    : `text-[15px] font-bold`
              }
            >
              {d.day}
            </span>
            <span
              className={
                selectedDate === d.iso
                  ? `text-[8px] text-white font-bold`
                  : theme === "dark"
                    ? `text-[8px] text-black font-bold`
                    : `text-[8px] font-bold`
              }
            >
              {d.month}
            </span>
          </button>
        ))}
      </div>

      {/* TEMPLATE SLIDER */}

      <div className="relative  flex items-center w-full h-[110px] px-1">
        <div
          ref={sliderRef}
          className="slider-track flex gap-4 overflow-x-auto px-1 py-2"
        >
          {festivaltempdata.map((card) => (
            <div
              key={card.id}
              className="flex-shrink-0  h-[100px]  w-[90px] rounded-xl overflow-hidden cursor-pointer"
            >
              <img
                src={card.image}
                alt="festival"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* RIGHT SCROLL */}

        <button
          onClick={() => scroll(1)}
          className="absolute right-1 z-10 w-6 h-6 rounded-full bg-gray-200 text-black"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function generateDates() {
  const dates = [];

  for (let i = 0; i < 10; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);

    dates.push({
      iso: d.toISOString().split("T")[0],
      day: d.getDate(),
      month: d.toLocaleString("default", { month: "long" }),
    });
  }

  return dates;
}
