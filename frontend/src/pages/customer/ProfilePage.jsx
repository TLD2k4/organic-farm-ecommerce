// src\pages\customer\ProfilePage.jsx

import { useSearchParams } from "react-router-dom";

import ProfileSidebar from "@/components/ui/customer/profile/ProfileSidebar";
import ProfileInfoForm from "@/components/ui/customer/profile/ProfileInfoForm";
import ChangePasswordForm from "@/components/ui/customer/profile/ChangePasswordForm";
import AddressSection from "@/components/ui/customer/profile/AddressSection";
import OrderSection from "@/components/ui/customer/profile/OrderSection";
import ReviewSection from "@/components/ui/customer/profile/ReviewSection";

export default function ProfilePage() {
  const [searchParams] = useSearchParams();

  const tab = searchParams.get("tab") || "info";

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-4">
      <ProfileSidebar />

      <div>
        {tab === "info" && <ProfileInfoForm />}

        {tab === "password" && <ChangePasswordForm />}

        {tab === "address" && <AddressSection />}

        {tab === "orders" && <OrderSection />}

        {tab === "reviews" && <ReviewSection focusReviewId={searchParams.get("review_id")} />}
      </div>
    </div>
  );
}
