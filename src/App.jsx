import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
//import VerifyEmail from "./pages/VerifyEmail";
import MySkills from "./pages/MySkills";
import Discover from "./pages/Discover";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import CompleteProfile from "./pages/CompleteProfile";
import AuthCallback from "./pages/AuthCallback";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/skills" element={<MySkills />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/complete-profile" element={<CompleteProfile />}/>
        <Route
  path="/auth/callback"
  element={<AuthCallback />}
/>


        {/* Protected application */}
        <Route path="/dashboard" element={<Dashboard />} />
    
         
      </Routes>
    </BrowserRouter>
  );
}

export default App;