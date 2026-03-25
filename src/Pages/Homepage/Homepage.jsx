import React from "react";
import Carosel from "./Component/Carosel";
import Festival from "./Component/Festival";
import Listmlmtemp from "./Component/Listmlmtemp";
import ListOfGenaraltemp from "./Component/ListOfGenaraltemp";

function Homepage() {
  return (
    <>
      <div className="flex flex-col justify-start items-center lg:gap-3 gap-2 h-screen w-full">
        <Carosel />
        <Festival />
        <Listmlmtemp />
        <ListOfGenaraltemp />
      </div>
    </>
  );
}

export default Homepage;
