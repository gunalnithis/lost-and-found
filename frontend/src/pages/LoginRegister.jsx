import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import { signInWithPopup } from "firebase/auth";
import {
  auth,
  facebookProvider,
  googleProvider,
  hasRequiredFirebaseConfig,
} from "../config/firebase";

const LoginRegister = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    itNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "student",
  });

  useEffect(() => {
    if (location.state?.message) {
      setInfoMessage(location.state.message);
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error when typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedEmail = formData.email.trim().toLowerCase();

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const url = isLogin
      ? `${API_BASE}/api/users/login`
      : `${API_BASE}/api/users`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isLogin
            ? { email: normalizedEmail, password: formData.password }
            : {
                name: formData.name,
                itNumber: formData.itNumber,
                email: normalizedEmail,
                password: formData.password,
                userType: formData.userType,
              },
        ),
      });

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(
          `Unexpected response from server: ${text.substring(0, 50)}...`,
        );
      }

      if (response.ok) {
        if (isLogin) {
          // Store user info in localStorage
          localStorage.setItem("userInfo", JSON.stringify(data));
          alert("Login successful!");
          navigate("/");
          // Force a page refresh or use a state management tool to update Navbar
          window.location.reload();
        } else {
          alert("Registration successful! Now please login.");
          setIsLogin(true);
        }
      } else {
        const fallbackMessage = isLogin
          ? "Password or email is wrong, please try again."
          : "Registration failed. Please check your details and try again.";

        const errorMsg = data?.message || fallbackMessage;
        setError(errorMsg);
        alert(errorMsg);
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        error.message || "Failed to connect to the server. Please try again.",
      );
    }
  };

  const handleSocialLogin = async (providerType) => {
    setError("");

    if (!hasRequiredFirebaseConfig || !auth) {
      setError(
        "Social login is not configured yet. Please set Firebase environment variables.",
      );
      return;
    }

    const provider = providerType === "google" ? googleProvider : facebookProvider;

    if (!provider) {
      setError("Selected social login provider is unavailable.");
      return;
    }

    try {
      const result = await signInWithPopup(auth, provider);
      const socialUser = result.user;

      const response = await fetch(`${API_BASE}/api/users/social-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: socialUser.email,
          name: socialUser.displayName,
          profilePic: socialUser.photoURL,
          provider: providerType,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Social login failed");
      }

      localStorage.setItem("userInfo", JSON.stringify(data));
      alert("Login successful!");
      navigate("/");
      window.location.reload();
    } catch (socialError) {
      setError(socialError.message || "Unable to complete social login.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-deep-bg px-4 py-16">
      <div className="theme-card w-full max-w-md rounded-2xl p-8 shadow-xl shadow-black/40">
        {/* Title */}
        <h2 className="mb-2 bg-gradient-to-r from-sky-300 to-cyan-400 bg-clip-text text-center text-2xl font-bold text-transparent">
          {isLogin ? "Login" : "Register"}
        </h2>

        {/* Info Message */}
        {infoMessage && (
          <p className="mb-4 rounded-lg border border-sky-500/40 bg-sky-950/40 py-2 text-center text-sm font-medium text-sky-300">
            {infoMessage}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p className="mb-4 rounded-lg border border-red-500/40 bg-red-950/40 py-2 text-center text-sm font-medium text-red-400">
            {error}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              {/* Full Name */}
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="theme-input px-4 py-2"
                required
              />
              {/* IT Number */}
              <input
                type="text"
                name="itNumber"
                value={formData.itNumber}
                onChange={handleChange}
                placeholder="IT Number"
                className="theme-input px-4 py-2"
                required
              />
              <select
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                className="theme-input px-4 py-2"
                required
              >
                <option value="student">Student</option>
                <option value="lecture">Lecture</option>
                <option value="others">Others</option>
              </select>
            </>
          )}

          {/* Email */}
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({
                ...formData,
                email: e.target.value.toLowerCase(),
              });
              setError("");
            }}
            onBlur={(e) =>
              setFormData((prev) => ({
                ...prev,
                email: e.target.value.trim().toLowerCase(),
              }))
            }
            placeholder="Email"
            className="theme-input px-4 py-2"
            required
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="theme-input px-4 py-2"
            required
          />

          {/* Confirm Password (only for register) */}
          {!isLogin && (
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="theme-input px-4 py-2"
              required
            />
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="rounded-lg bg-gradient-accent py-2 font-semibold text-white shadow transition-all duration-300 hover:bg-gradient-accent-hover hover:shadow-lg"
          >
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        {isLogin && (
          <>
            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-700/70" />
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                or continue with
              </span>
              <span className="h-px flex-1 bg-slate-700/70" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                className="rounded-lg border border-slate-600/80 bg-slate-900/40 px-4 py-2 font-semibold text-slate-200 transition hover:border-sky-400 hover:text-sky-300"
              >
                Login with Google
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin("facebook")}
                className="rounded-lg border border-slate-600/80 bg-slate-900/40 px-4 py-2 font-semibold text-slate-200 transition hover:border-blue-400 hover:text-blue-300"
              >
                Login with Facebook
              </button>
            </div>
          </>
        )}

        {/* Toggle Link */}
        <p className="mt-4 text-center text-deep-muted">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span
            onClick={() => setIsLogin(!isLogin)}
            className="cursor-pointer font-semibold text-sky-400 hover:underline"
          >
            {isLogin ? "Register" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginRegister;
