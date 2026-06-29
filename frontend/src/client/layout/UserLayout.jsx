import { Outlet } from "react-router-dom";
import UserNavbar from "../components/UserNavbar";

export default function UserLayout() {
  return (
    <div>
      <UserNavbar />
      <Outlet />
    </div>
  );
}
