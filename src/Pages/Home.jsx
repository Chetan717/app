// Pages/Home.jsx
import React from "react";
import { Moon, Sun } from "@gravity-ui/icons";
import { useGeneralData } from "../Context/GeneralContext";

function Home() {
  const { theme, toggleTheme } = useGeneralData();
  const isDark = theme === "dark";

  return (
    <div className="flex justify-center items-center h-screen">
      <h1 className="text-xl font-bold">MLMBOOSTER</h1>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-full transition-all duration-300 hover:bg-default"
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Sun className="size-5 text-foreground" />
        ) : (
          <Moon className="size-5 text-foreground" />
        )}
      </button>
    </div>
  );
}

export default Home;