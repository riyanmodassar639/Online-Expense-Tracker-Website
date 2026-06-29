import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "../styles/auth.css";

export default function Register() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (form.password !== form.confirmPassword) {
      setMsg("Passwords do not match.");
      return;
    }

    if (!profilePic) {
      setMsg("Profile picture is required.");
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("email", form.email);
      fd.append("firstName", form.firstName);
      fd.append("lastName", form.lastName);
      fd.append("phone", form.phone);
      fd.append("username", form.username);
      fd.append("password", form.password);
      fd.append("profilePic", profilePic);

      await api.post("/auth/signup", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ✅ direct home + toast
      nav("/", { state: { toast: "Please wait for admin approval." } });
    } catch (err) {
      setMsg(err?.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authRoot authBlurBg">
      <div className="authCard authCardCompact">
        <h2 className="authTitle">Register</h2>
        <p className="authSub">Create account (admin will approve your access).</p>

        {msg ? <div className="authMsg authMsgGlassy">{msg}</div> : null}

        {/* ✅ Scroll ONLY inside this wrapper */}
        <div className="authCardScroll">
          <form onSubmit={onSubmit} className="authForm">
            <div className="authGrid">
              <div>
                <label className="authLabel">First Name</label>
                <input
                  className="authInput"
                  name="firstName"
                  value={form.firstName}
                  onChange={onChange}
                  required
                />
              </div>

              <div>
                <label className="authLabel">Last Name</label>
                <input
                  className="authInput"
                  name="lastName"
                  value={form.lastName}
                  onChange={onChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="authLabel">Email</label>
              <input
                className="authInput"
                name="email"
                value={form.email}
                onChange={onChange}
                required
              />
            </div>

            <div>
              <label className="authLabel">Phone</label>
              <input
                className="authInput"
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="03xx..."
                required
              />
            </div>

            <div>
              <label className="authLabel">Username</label>
              <input
                className="authInput"
                name="username"
                value={form.username}
                onChange={onChange}
                required
              />
            </div>

            <div className="authGrid">
              <div>
                <label className="authLabel">Create Password</label>
                <input
                  className="authInput"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  required
                />
              </div>

              <div>
                <label className="authLabel">Re-enter Password</label>
                <input
                  className="authInput"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={onChange}
                  required
                />
              </div>
            </div>

            <label className="authLabel">Profile Picture (required)</label>
            <input
              className="authInput"
              type="file"
              accept="image/*"
              required
              onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
            />

            <button className="authBtn" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          {/* ✅ bottom links inside scroll wrapper so no overflow issues */}
          <div className="authBottom">
            Already have an account? <Link to="/login">Login</Link>
          </div>

          <div className="authBottom" style={{ marginTop: 8 }}>
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
