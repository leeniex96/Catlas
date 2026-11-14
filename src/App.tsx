import { Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";
import AccountPage from "@/pages/AccountPage";
import AdminPage from "@/pages/AdminPage";
import FriendsPage from "@/pages/FriendsPage";
import BusinessFormPage from "@/pages/BusinessFormPage";
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";
import PassportPage from "@/pages/PassportPage";
import PlaceDetailPage from "@/pages/PlaceDetailPage";
import RequestSpotPage from "@/pages/RequestSpotPage";

// Every page in the app. Add a new page by adding a <Route> here.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="places/:slug" element={<PlaceDetailPage />} />
        <Route path="list-your-business" element={<BusinessFormPage />} />
        <Route path="request-a-spot" element={<RequestSpotPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="passport" element={<PassportPage />} />
        <Route path="passport/:userId" element={<PassportPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
