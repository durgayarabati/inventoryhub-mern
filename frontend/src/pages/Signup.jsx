import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, register, logout } = useAuth();
  const nav = useNavigate();

  // Demo creds from frontend/.env
  const demoEmail = import.meta.env.VITE_DEMO_ADMIN_EMAIL;
  const demoPass = import.meta.env.VITE_DEMO_ADMIN_PASSWORD;

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [selectedRole, setSelectedRole] = useState("staff"); // "staff" | "admin"

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = useMemo(
    () => (mode === "login" ? "Welcome back" : "Create your account"),
    [mode]
  );

  const resetForMode = (nextMode) => {
    setMode(nextMode);
    setPassword("");
    setShowPass(false);
    setLoading(false);
  };

  const clearLocalAuth = () => {
    if (typeof logout === "function") logout();
    else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const data = await login(email, password);

        // Role check after backend response (backend is source of truth)
        if (selectedRole !== data?.user?.role) {
          clearLocalAuth();
          toast.error(
            `This account is ${data?.user?.role}. Please choose ${data?.user?.role} role.`
          );
          setLoading(false);
          return;
        }

        toast.success(`Welcome, ${data?.user?.name || "User"} ✅`);
        nav("/");
      } else {
        // Register: always staff (no role selection)
        if (!name.trim()) {
          toast.error("Please enter your name");
          setLoading(false);
          return;
        }

        await register(name, email, password);
        toast.success("Account created ✅");
        nav("/");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center px-4 py-8 sm:px-6">
      {/* Background blobs (hide on mobile) */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-black/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-black/10 rounded-full blur-3xl" />
      </div>

      {/* Wrapper */}
      <div className="relative w-full max-w-md md:max-w-4xl grid md:grid-cols-2 gap-5 md:gap-6">
        {/* Left brand panel */}
        <div className="hidden md:flex flex-col justify-between bg-black text-white rounded-3xl p-8 shadow">
          <div>
            <p className="text-sm text-white/70">Inventory & Management</p>
            <h1 className="text-3xl font-bold mt-2">InventoryHub</h1>
            <p className="text-white/70 mt-4 leading-relaxed">
              Manage products, stock and orders with role-based access.
            </p>

            <div className="mt-6 space-y-3">
              <Feature icon="📦" text="Product management" />
              <Feature icon="📉" text="Low-stock alerts" />
              <Feature icon="🧾" text="Order tracking" />
            </div>
          </div>

          <p className="text-xs text-white/60">
            “Smart Inventory. Smart Business.”
          </p>
        </div>

        {/* Right auth card */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 md:p-8 shadow border">
          {/* Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => resetForMode("login")}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition ${mode === "login" ? "bg-white shadow" : "text-gray-600"
                }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => resetForMode("register")}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition ${mode === "register" ? "bg-white shadow" : "text-gray-600"
                }`}
            >
              Register
            </button>
          </div>

          {/* ✅ Demo Admin card (ONLY login mode) */}
          {mode === "login" && demoEmail && demoPass && (
            <div className="mt-4 rounded-2xl border bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Demo Admin</p>
                <span className="text-xs px-2 py-1 rounded-lg border bg-white">
                  Admin
                </span>
              </div>

              <p className="text-xs text-gray-600 mt-2">
                Email: <span className="font-mono">{demoEmail}</span>
              </p>
              <p className="text-xs text-gray-600">
                Password: <span className="font-mono">{demoPass}</span>
              </p>

              <button
                type="button"
                className="mt-3 w-full px-3 py-2.5 rounded-xl bg-black text-white text-sm font-semibold"
                onClick={async () => {
                  try {
                    setLoading(true);

                    const data = await login(demoEmail, demoPass);

                    // role safety check
                    if (data?.user?.role !== "admin") {
                      clearLocalAuth();
                      toast.error("Demo admin role mismatch");
                      setLoading(false);
                      return;
                    }

                    toast.success(`Welcome, ${data?.user?.name || "Admin"} ✅`);
                    nav("/");
                  } catch (err) {
                    toast.error(err?.response?.data?.message || "Demo login failed");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "Logging in..." : "Use Demo Admin"}
              </button>


              <p className="text-[11px] text-gray-500 mt-2">
                Note: Demo credentials are for recruiter testing only.
              </p>
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
            <p className="text-gray-500 text-sm mt-1">
              {mode === "login"
                ? "Login to continue to dashboard"
                : "Register to create a staff account"}
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {/* Register: Name */}
              {mode === "register" && (
                <Field label="Name">
                  <input
                    className="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-black/20"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </Field>
              )}

              {/* Login: Role */}
              {mode === "login" && (
                <Field label="Login as">
                  <select
                    className="mt-1 w-full border rounded-xl px-3 py-2.5 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-black/20"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Role is verified after login.
                  </p>
                </Field>
              )}

              <Field label="Email">
                <input
                  className="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </Field>

              <Field label="Password">
                <div className="mt-1 flex items-center gap-2 border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-black/20">
                  <input
                    className="w-full outline-none text-sm sm:text-base"
                    placeholder="••••••••"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="text-sm font-semibold text-gray-700 hover:opacity-80 whitespace-nowrap"
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Minimum 6 characters.
                </p>
              </Field>

              <button
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:opacity-95 disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Login"
                    : "Create account"}
              </button>

              <div className="text-center text-sm text-gray-600">
                {mode === "login" ? (
                  <>
                    New here?{" "}
                    <button
                      type="button"
                      onClick={() => resetForMode("register")}
                      className="font-semibold underline underline-offset-4"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => resetForMode("login")}
                      className="font-semibold underline underline-offset-4"
                    >
                      Login
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>

          {/* Mobile brand footer */}
          <div className="md:hidden mt-6 p-4 rounded-2xl bg-gray-50 border">
            <p className="font-bold">InventoryHub</p>
            <p className="text-gray-600 text-sm mt-1">
              Smart Inventory. Smart Business.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function Feature({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-xl bg-white/10 grid place-items-center">
        {icon}
      </span>
      <p className="text-white/80 text-sm">{text}</p>
    </div>
  );
}
