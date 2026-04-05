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

 // In Festival.jsx
const { cachedFestivalData, setCachedFestivalData } = useGeneralData();

const loadFestival = async (date) => {
  // ✅ Return early if already cached
  if (cachedFestivalData[date]) {
    setFestivalTempData(cachedFestivalData[date]);
    return;
  }
  const data = await Festival_template(date);
  setCachedFestivalData(prev => ({ ...prev, [date]: data }));
  setFestivalTempData(data);
};

  const scroll = (dir) => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: dir * 220, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col gap-3 justify-center items-center h-full  p-2  w-full">
      {/* DATE SELECTOR */}
      <div className="flex items-center w-full gap-1s">
        <button
          className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex-shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            {/* Outer box */}
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            {/* Top hooks */}
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            {/* Divider line */}
            <line x1="3" y1="10" x2="21" y2="10" />
            {/* Date dots */}
            <circle cx="8" cy="14" r="0.5" fill="currentColor" />
            <circle cx="12" cy="14" r="0.5" fill="currentColor" />
            <circle cx="16" cy="14" r="0.5" fill="currentColor" />
            <circle cx="8" cy="18" r="0.5" fill="currentColor" />
            <circle cx="12" cy="18" r="0.5" fill="currentColor" />
          </svg>
        </button>
        <h3 className="text-sm font-bold truncate">{`Festival Calender`}</h3>
      </div>
      <div className="slider-track flex hide-scrollbar  lg:gap-5 gap-2 overflow-x-auto w-full  py-1">
        {dates?.map((d) => (
          <button
            key={d.iso}
            onClick={() => setSelectedDate(d.iso)}
            className={`flex flex-col items-center  py-1 rounded-br-xl rounded-tl-xl min-w-[45px]
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

      {festivaltempdata?.length === 0 ? null : (
        <div className="relative bg-gray-200 rounded-lg p-1.5  flex items-center w-full h-[110px] ">
          <div
            ref={sliderRef}
            className="slider-track flex gap-4 overflow-x-auto px-1 py-2"
          >
            {festivaltempdata?.map((card) => (
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
        </div>
      )}
    </div>
  );
}

function generateDates() {
  const dates = [];

  for (let i = 0; i < 17; i++) {
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
