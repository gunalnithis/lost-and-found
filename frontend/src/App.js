import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import LostItems from "./pages/LostItems";
import FoundItems from "./pages/FoundItems";
import PostItem from "./pages/PostItem";
import About from "./pages/About";
import Contact from "./pages/Contact";
import LoginRegister from "./pages/LoginRegister"; 
import Profile from "./pages/Profile";
import AdvertisementRequest from "./pages/AdvertisementRequest";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-deep-bg bg-gradient-page text-slate-200">
      <Navbar />
      <div className="pt-20">

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lost-items" element={<LostItems />} />
          <Route path="/found-items" element={<FoundItems />} />
          <Route path="/post-item" element={<PostItem />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<LoginRegister />} /> 
          <Route path="/profile" element={<Profile />} />
          <Route path="/advertisement-request" element={<AdvertisementRequest />} />
        </Routes>
      </div>
      </div>
    </Router>

  );
}

export default App;
