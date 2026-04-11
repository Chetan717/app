// import React, { useState } from "react";
// import { useGeneralData } from "../../../Context/GeneralContext";
// import { useNavigate } from "react-router";

// function ListOfGenaraltemp({ templates, loading }) {
//   const [selectedTemp, setSelectedTemp] = useState(null);
//   const navigate = useNavigate();
//   const { selType, setSelType } = useGeneralData();

//   const handleImagePress = (item) => {
//     setSelectedTemp(item);
//     const selttype = {
//       id: item.id,
//       type: item.type,
//       serial: item.serial,
//       ShowCaseForm: item.ShowCaseForm,
//       Subtype: item.Subtype,
//     };
//     setSelType(selttype);
//     navigate("/alltemp");
//   };

//   console.log(templates);

//   // ✅ Helper to avoid repeating the condition everywhere
//   const isGridType = (type) =>
//     type === "Welcome_Closing" ||
//     type === "Anniversary_Birthday" ||
//     type === "ThankYou_Birthday_Anniversary";

//   return (
//     <div className="flex justify-center mb-3 p-2 lg:items-center items-center flex-col lg:w-[400px] w-full">
//       {templates?.map((group) => (
//         <div key={group.type} className="w-full mb-2">
//           {/* ✅ Hide heading for grid types */}
//           {!isGridType(group.type) && (
//             <h2 className="text-sm font-bold mb-1">
//               {group.type.replaceAll("_", " ")}
//             </h2>
//           )}

//           {/* ✅ Fixed: each comparison now uses group.type === "..." */}
//           {isGridType(group.type) ? (
//             <div className="flex justify-center w-full items-center flex-row gap-0 bg-gray-200 rounded-xl">
//               {group?.templates?.map((item) => (
//                 <div
//                   key={item.id}
//                   className="rounded-xl flex flex-col justify-center items-center h-[80px] w-1/2 p-1"
//                   onClick={() => handleImagePress(item)}
//                 >
//                   <img
//                     src={item.image}
//                     className={`rounded-lg h-[70px] w-full object-cover cursor-pointer transition-all duration-150
//                       ${
//                         selectedTemp?.id === item?.id
//                           ? "border-2"
//                           : "border-2 border-transparent"
//                       }`}
//                   />

//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="flex justify-start items-center flex-row gap-3 bg-gray-200 rounded-xl p-2 hide-scrollbar overflow-x-auto">
//               {group?.templates?.map((item) => (
//                 <div
//                   key={item.id}
//                   className="rounded-xl flex-shrink-0"
//                   onClick={() => handleImagePress(item)}
//                 >
//                   <img
//                     src={item.image}
//                     className={`rounded-lg bg-gray-200 w-[85px] h-[85px] object-cover cursor-pointer transition-all duration-150
//                       ${
//                         selectedTemp?.id === item?.id
//                           ? "border-2"
//                           : "border-2 border-transparent"
//                       }`}
//                   />
//                    <p className="text-xs capitalize ">{item.Subtype}</p>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       ))}

//       <div className="w-[90%] flex justify-center items-center mx-auto mt-2">
//         <p className="text-center font-medium text-[11px] text-gray-500">
//           We are working on more images. We will share with you soon. Thank you
//           for your patience ☺️!
//         </p>
//       </div>

//       {loading && (
//         <div className="text-center py-6 font-semibold">
//           Loading templates...
//         </div>
//       )}
//     </div>
//   );
// }

// export default ListOfGenaraltemp;

import React, { useState } from "react";
import { useGeneralData } from "../../../Context/GeneralContext";
import { useNavigate } from "react-router";

function ListOfGenaraltemp({ templates, loading }) {
  const [selectedTemp, setSelectedTemp] = useState(null);
  const navigate = useNavigate();
  const { selType, setSelType } = useGeneralData();

  const handleImagePress = (item) => {
    setSelectedTemp(item);
    const selttype = {
      id: item.id,
      type: item.type,
      serial: item.serial,
      ShowCaseForm: item.ShowCaseForm,
      Subtype: item.Subtype,
    };
    setSelType(selttype);
    navigate("/alltemp");
  };

  const isGridType = (type) =>
    type === "Welcome_Closing" ||
    type === "Anniversary_Birthday" ||
    type === "ThankYou_Birthday_Anniversary";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium tracking-wide">
          Loading templates...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto px-3 pb-6">
      {templates?.map((group) => (
        <div key={group.type} className="w-full mb-4">
          {/* Section Header */}
          {!isGridType(group.type) && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="w-1 h-4 rounded-full bg-accent inline-block" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-600">
                {group.type.replaceAll("_", " ")}
              </h2>
            </div>
          )}

          {/* Grid Layout — for special types */}
          {isGridType(group.type) ? (
            <div className="grid grid-cols-2 gap-2">
              {group?.templates?.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleImagePress(item)}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer group
                    shadow-sm transition-all duration-200 active:scale-95
                    ${
                      selectedTemp?.id === item?.id
                        ? "ring-2 ring-indigo-500 ring-offset-2"
                        : "ring-1 ring-gray-200"
                    }`}
                >
                  <img
                    src={item.image}
                    className="w-full h-[60px] object-cover transition-transform duration-300 group-hover:scale-105"
                    alt={item.Subtype || "template"}
                  />
                  {/* Subtle overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded-2xl" />
                  {/* Selected badge */}
                  {selectedTemp?.id === item?.id && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Horizontal Scroll Layout */
            <div className="flex flex-row gap-2.5 overflow-x-auto pb-1 hide-scrollbar">
              {group?.templates?.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleImagePress(item)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group
                    transition-all duration-200 active:scale-95`}
                >
                  <div
                    className={`rounded-2xl overflow-hidden transition-all duration-200
                      ${
                        selectedTemp?.id === item?.id
                          ? "ring-2 ring-indigo-500 ring-offset-2 shadow-md"
                          : "ring-1 ring-gray-200 shadow-sm"
                      }`}
                  >
                    <img
                      src={item.image}
                      className="w-[82px] h-[82px] object-contain transition-transform duration-300 group-hover:scale-105"
                      alt={item.Subtype || "template"}
                    />
                  </div>
                  {item.Subtype && (
                    <p className="text-[10px] font-medium text-gray-500 capitalize text-center w-[82px] truncate">
                      {item.Subtype}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Footer note */}
      <div className="mt-4 w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
        <p className="text-center text-[11px] text-gray-400 leading-relaxed">
          🎨 More templates coming soon — thank you for your patience!
        </p>
      </div>
    </div>
  );
}

export default ListOfGenaraltemp;
