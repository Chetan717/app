import Home from "./Pages/Home";
import { Login } from "./Auth/Login";
import { Signup } from "./Auth/Signup";
import ProtectedRoute from "./Auth/ProtectedR";
import { Routes, Route } from "react-router";
import { Forgetpin } from "./Auth/ForgetPin";
import Layout from "./Layout";
import MainSubscription from "./Pages/Subscription/MainSubscription";
function App() {
  return (
    <Routes>

      {/* ── Protected routes (with Sidebar + Header) ── */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        }
      />
        <Route
        path="/subscription"
        element={
          <ProtectedRoute>
            <Layout>
             <MainSubscription/>
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route path="/login"     element={<Login />}     />
      <Route path="/signup"    element={<Signup />}    />
      <Route path="/forgetpin" element={<Forgetpin />} />

    </Routes>
  );
}

export default App;