import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const adminLogin = (data) =>
  API.post("/admin/login", data);
