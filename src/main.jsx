import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter, Routes, Route } from "react-router";
import { GeneralContext } from "./Context/GeneralContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GeneralContext>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </GeneralContext>
  </StrictMode>
);