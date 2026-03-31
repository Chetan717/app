import React, { useState } from "react";
import { useGeneralData } from "../../../Context/GeneralContext";
import { useNavigate } from "react-router";

function ListOfGenaraltemp({ templates, loading }) {
  const [selectedTemp, setSelectedTemp] = useState(null);
  const { selType, setSelType } = useGeneralData();
  const navigate = useNavigate();

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

  // ✅ Helper to avoid repeating the condition everywhere
  const isGridType = (type) =>
    type === "Welcome_Closing" ||
    type === "Anniversary_Birthday" ||
    type === "ThankYou_Birthday_Anniversary";

  return (
    <div className="flex justify-center mb-3 p-2 lg:items-center items-center flex-col lg:w-[400px] w-full">
      {templates?.map((group) => (
        <div key={group.type} className="w-full mb-2">
          {/* ✅ Hide heading for grid types */}
          {!isGridType(group.type) && (
            <h2 className="text-sm font-bold mb-1">
              {group.type.replaceAll("_", " ")}
            </h2>
          )}

          {/* ✅ Fixed: each comparison now uses group.type === "..." */}
          {isGridType(group.type) ? (
            <div className="flex justify-center w-full items-center flex-row gap-0 bg-gray-200 rounded-xl">
              {group?.templates?.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl flex justify-center items-center h-[80px] w-1/2 p-1"
                  onClick={() => handleImagePress(item)}
                >
                  <img
                    src={item.image}
                    className={`rounded-lg h-[70px] w-full object-cover cursor-pointer transition-all duration-150
                      ${
                        selectedTemp?.id === item?.id
                          ? "border-2"
                          : "border-2 border-transparent"
                      }`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-start items-center flex-row gap-3 bg-gray-200 rounded-xl p-2 hide-scrollbar overflow-x-auto">
              {group?.templates?.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl flex-shrink-0"
                  onClick={() => handleImagePress(item)}
                >
                  <img
                    src={item.image}
                    className={`rounded-lg bg-gray-200 w-[85px] h-[85px] object-cover cursor-pointer transition-all duration-150
                      ${
                        selectedTemp?.id === item?.id
                          ? "border-2"
                          : "border-2 border-transparent"
                      }`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="w-[90%] flex justify-center items-center mx-auto mt-2">
        <p className="text-center font-medium text-[11px] text-gray-500">
          We are working on more images. We will share with you soon. Thank you
          for your patience ☺️!
        </p>
      </div>

      {loading && (
        <div className="text-center py-6 font-semibold">
          Loading templates...
        </div>
      )}
    </div>
  );
}

export default ListOfGenaraltemp;
