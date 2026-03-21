// Pages/Home.jsx
import React from "react";
import { Moon, Sun } from "@gravity-ui/icons";
import { useGeneralData } from "../Context/GeneralContext";

function Home() {
  const { theme, toggleTheme } = useGeneralData();
  const isDark = theme === "dark";

  return (
    <div className="flex justify-center items-center h-screen">
    Home
    </div>
  );
}

export default Home;