import Home from "./Pages/Home";
import { Login } from "./Auth/Login";
import { Signup } from "./Auth/Signup";
import ProtectedRoute from "./Auth/ProtectedR";
import { Routes, Route } from "react-router";
import { Forgetpin } from "./Auth/ForgetPin";
import { LastUpPin } from "./Auth/LastUpPin";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgetpin" element={<Forgetpin />} />
      <Route path="/lastuppin" element={<LastUpPin />} />
    </Routes>
  );
}

export default App;
