import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "../styles/authModal.css";

function Icon({ type }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" };
  const stroke = "currentColor";
  switch (type) {
    case "whatsapp":
      return (
        <svg {...common}>
          <path
            d="M20 12a8 8 0 0 1-11.9 7L4 20l1-3.8A8 8 0 1 1 20 12Z"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 9.5c.3 1.8 2.2 3.7 4 4l1.1-.7c.3-.2.7-.2 1 0l1.1.7c.4.2.6.7.5 1.1-.2.7-.8 1.4-1.6 1.4-4 0-7.3-3.3-7.3-7.3 0-.8.7-1.4 1.4-1.6.4-.1.9.1 1.1.5l.7 1.1c.2.3.2.7 0 1l-.7 1.1Z"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path
            d="M14 8h2V5h-2c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14V8Z"
            fill="currentColor"
          />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <path
            d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z"
            stroke={stroke}
            strokeWidth="2"
          />
          <path
            d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
            stroke={stroke}
            strokeWidth="2"
          />
          <path d="M17.5 6.5h.01" stroke={stroke} strokeWidth="3" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <path d="M6 10v10" stroke={stroke} strokeWidth="2" />
          <path d="M6 7.2v.2" stroke={stroke} strokeWidth="4" />
          <path d="M10 20v-6.2c0-2.6 3-2.8 3-0.2V20" stroke={stroke} strokeWidth="2" />
          <path d="M13 13.5c0-2.4 4-2.8 4-.2V20" stroke={stroke} strokeWidth="2" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path
            d="M6 19 18 5M6 5l12 14"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <path
            d="M21 12s0-4-1-5-4-1-8-1-7 0-8 1-1 5-1 5 0 4 1 5 4 1 8 1 7 0 8-1 1-5 1-5Z"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M11 10l4 2-4 2v-4Z" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AuthModal({ mode = "login" }) {
  const navigate = useNavigate();

  const countries = useMemo(
    () => [
      { code: "+92", flag: "🇵🇰", label: "Pakistan" },
      { code: "+91", flag: "🇮🇳", label: "India" },
      { code: "+971", flag: "🇦🇪", label: "UAE" },
      { code: "+44", flag: "🇬🇧", label: "UK" },
      { code: "+1", flag: "🇺🇸", label: "USA" },
    ],
    []
  );

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [failCount, setFailCount] = useState(0);

  // forgot password flow
  const [forgotOpen, setForgotOpen] = useState(false);
  const [fpStep, setFpStep] = useState(1); // 1 email, 2 code+new pass
  const [fpEmail, setFpEmail] = useState("");
  const [fpCode, setFpCode] = useState("");
  const [fpNewPass, setFpNewPass] = useState("");
  const [fpNewPass2, setFpNewPass2] = useState("");

  // register
  const [email, setEmail] = useState("");
  const [countryIdx, setCountryIdx] = useState(0);
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regPass2, setRegPass2] = useState("");
  const [profilePic, setProfilePic] = useState(null);

  const close = () => navigate("/");

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { username, password });
      setFailCount(0);

      // save user (simple)
      localStorage.setItem("user", JSON.stringify(res.data.user || {}));
      close();
    } catch (err) {
      const status = err?.response?.status;
      const m = err?.response?.data?.message || "Login failed";

      setMsg(m);

      // 401 -> wrong
      if (status === 401) {
        setFailCount((c) => {
          const next = c + 1;
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setMsg("");

    if (regPass !== regPass2) {
      setMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countries[countryIdx].code}${phone}`;

      const fd = new FormData();
      fd.append("email", email);
      fd.append("phone", fullPhone);
      fd.append("firstName", firstName);
      fd.append("lastName", lastName);
      fd.append("username", regUsername);
      fd.append("password", regPass);

      if (profilePic) fd.append("profilePic", profilePic);

      const res = await api.post("/auth/signup", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg(res?.data?.message || "Registered! Wait for admin approval.");

      // after 1.2 sec go login
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  }

  async function requestReset() {
    setMsg("");
    if (!fpEmail) return setMsg("Please enter your email.");

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password/request", { email: fpEmail });
      setMsg(res?.data?.message || "Code sent to your email.");
      setFpStep(2);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setMsg("");
    if (!fpCode) return setMsg("Enter 6 digit code.");
    if (fpNewPass.length < 6) return setMsg("Password must be at least 6 characters.");
    if (fpNewPass !== fpNewPass2) return setMsg("Passwords do not match.");

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password/reset", {
        email: fpEmail,
        code: fpCode,
        newPassword: fpNewPass,
      });

      setMsg(res?.data?.message || "Password updated.");
      setTimeout(() => {
        setForgotOpen(false);
        setFpStep(1);
        setFpCode("");
        setFpNewPass("");
        setFpNewPass2("");
        navigate("/login");
      }, 900);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  const showForgotLink = mode === "login" && failCount >= 5;

  return (
    <div className="authOverlay" role="dialog" aria-modal="true">
      <div className={`authModal ${mode === "register" ? "authModal--register" : ""}`}>
        <button className="authClose" onClick={close} aria-label="Close">
          ×
        </button>

        {/* Header */}
        <div className="authHeader">
          <div className="authBrand">ExpenseTracker</div>

          {mode === "login" ? (
            <>
              <div className="authTitle">Welcome Back</div>
              <div className="authSub">Login to continue (admin approval required).</div>
            </>
          ) : (
            <>
              <div className="authTitle">Create Account</div>
              <div className="authSub">Register now — admin will approve your access.</div>
            </>
          )}

          {msg ? <div className="authMsg">{msg}</div> : null}
        </div>

        {/* BODY */}
        {mode === "login" ? (
          <>
            {!forgotOpen ? (
              <form className="authForm" onSubmit={handleLogin}>
                <div>
                  <div className="authLabel">Username</div>
                  <input
                    className="authInput"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <div className="authLabel">Password</div>
                  <input
                    className="authInput"
                    placeholder="Enter password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button className="authBtn" disabled={loading}>
                  {loading ? "Please wait..." : "Login"}
                </button>

                <div className="authSwitch">
                  Don&apos;t have an account?{" "}
                  <a href="#" onClick={(e) => (e.preventDefault(), navigate("/register"))}>
                    Register
                  </a>
                </div>

                {showForgotLink ? (
                  <div className="authSwitch" style={{ marginTop: 4 }}>
                    Forgot password?{" "}
                    <a
                      href="#"
                      onClick={(e) => (e.preventDefault(), setForgotOpen(true))}
                    >
                      Reset now
                    </a>
                  </div>
                ) : null}

                <div className="authDividerLine" />

                <div className="authSocialRow">
                  <a className="authSocialBtn" href="#" aria-label="WhatsApp"><Icon type="whatsapp" /></a>
                  <a className="authSocialBtn" href="#" aria-label="Facebook"><Icon type="facebook" /></a>
                  <a className="authSocialBtn" href="#" aria-label="Instagram"><Icon type="instagram" /></a>
                  <a className="authSocialBtn" href="#" aria-label="LinkedIn"><Icon type="linkedin" /></a>
                  <a className="authSocialBtn" href="#" aria-label="X"><Icon type="x" /></a>
                  <a className="authSocialBtn" href="#" aria-label="YouTube"><Icon type="youtube" /></a>
                </div>
              </form>
            ) : (
              <div className="authForm">
                <div className="authTitle" style={{ fontSize: 24, marginTop: 6 }}>
                  Reset Password
                </div>

                {fpStep === 1 ? (
                  <>
                    <div>
                      <div className="authLabel">Email</div>
                      <input
                        className="authInput"
                        placeholder="Enter your account email"
                        value={fpEmail}
                        onChange={(e) => setFpEmail(e.target.value)}
                      />
                    </div>

                    <button className="authBtn" onClick={requestReset} disabled={loading}>
                      {loading ? "Sending..." : "Send 6-Digit Code"}
                    </button>

                    <div className="authSwitch">
                      Back to{" "}
                      <a href="#" onClick={(e) => (e.preventDefault(), setForgotOpen(false))}>
                        Login
                      </a>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="authGrid">
                      <div>
                        <div className="authLabel">6-Digit Code</div>
                        <input
                          className="authInput"
                          placeholder="123456"
                          value={fpCode}
                          onChange={(e) => setFpCode(e.target.value)}
                        />
                      </div>

                      <div>
                        <div className="authLabel">Email</div>
                        <input className="authInput" value={fpEmail} disabled />
                      </div>
                    </div>

                    <div className="authGrid">
                      <div>
                        <div className="authLabel">New Password</div>
                        <input
                          className="authInput"
                          type="password"
                          value={fpNewPass}
                          onChange={(e) => setFpNewPass(e.target.value)}
                        />
                      </div>

                      <div>
                        <div className="authLabel">Re-enter Password</div>
                        <input
                          className="authInput"
                          type="password"
                          value={fpNewPass2}
                          onChange={(e) => setFpNewPass2(e.target.value)}
                        />
                      </div>
                    </div>

                    <button className="authBtn" onClick={resetPassword} disabled={loading}>
                      {loading ? "Updating..." : "Update Password"}
                    </button>

                    <div className="authSwitch">
                      Back to{" "}
                      <a href="#" onClick={(e) => (e.preventDefault(), setForgotOpen(false))}>
                        Login
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          // REGISTER (no scroll)
          <form className="authForm authForm--register" onSubmit={handleRegister}>
            <div className="authGrid">
              <div>
                <div className="authLabel">Email</div>
                <input
                  className="authInput"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="authLabel">Phone</div>
                <div className="phoneRow">
                  <select
                    className="phoneCode"
                    value={countryIdx}
                    onChange={(e) => setCountryIdx(Number(e.target.value))}
                    aria-label="Country code"
                  >
                    {countries.map((c, idx) => (
                      <option key={c.code} value={idx}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>

                  <input
                    className="authInput phoneNumber"
                    placeholder="03xx..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="authGrid">
              <div>
                <div className="authLabel">First Name</div>
                <input
                  className="authInput"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="authLabel">Last Name</div>
                <input
                  className="authInput"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="authGrid">
              <div>
                <div className="authLabel">Username</div>
                <input
                  className="authInput"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="authLabel">Password</div>
                <input
                  className="authInput"
                  type="password"
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="authGrid">
              <div>
                <div className="authLabel">Re-enter Password</div>
                <input
                  className="authInput"
                  type="password"
                  value={regPass2}
                  onChange={(e) => setRegPass2(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="authLabel">Profile Picture (optional)</div>
                <input
                  className="authInput"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <button className="authBtn" disabled={loading}>
              {loading ? "Please wait..." : "Create Account"}
            </button>

            {/* line + login switch */}
            <div className="authDividerLine" />

            <div className="authSwitch" style={{ textAlign: "center" }}>
              Already have an account?{" "}
              <a href="#" onClick={(e) => (e.preventDefault(), navigate("/login"))}>
                Login
              </a>
            </div>

            <div className="authSocialRow">
              <a className="authSocialBtn" href="#" aria-label="WhatsApp"><Icon type="whatsapp" /></a>
              <a className="authSocialBtn" href="#" aria-label="Facebook"><Icon type="facebook" /></a>
              <a className="authSocialBtn" href="#" aria-label="Instagram"><Icon type="instagram" /></a>
              <a className="authSocialBtn" href="#" aria-label="LinkedIn"><Icon type="linkedin" /></a>
              <a className="authSocialBtn" href="#" aria-label="X"><Icon type="x" /></a>
              <a className="authSocialBtn" href="#" aria-label="YouTube"><Icon type="youtube" /></a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
