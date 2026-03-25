// Pages/Home.jsx
import React from "react";
import { Moon, Sun } from "@gravity-ui/icons";
import { useGeneralData } from "../Context/GeneralContext";
import Homepage from "./Homepage/Homepage";

function Home() {
  const { theme, toggleTheme } = useGeneralData();
  const isDark = theme === "dark";

  return (
    <div className="flex justify-center items-center h-screen">
   <Homepage/>
    </div>
  );
}

export default Home;