// src/components/ui/customer/profile/ProfileSkeleton.jsx

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function ProfileSkeleton() {
  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      {/* Sidebar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col items-center">
          <Skeleton circle width={96} height={96} />

          <div className="mt-4 w-full">
            <Skeleton height={24} />
          </div>

          <div className="mt-2 w-full">
            <Skeleton height={18} />
          </div>
        </div>

        <div className="mt-6">
          <Skeleton height={12} width={80} />

          <div className="space-y-3 mt-3">
            <Skeleton height={44} />
            <Skeleton height={44} />
            <Skeleton height={44} />
            <Skeleton height={44} />
            <Skeleton height={44} />
          </div>

          <div className="mt-6">
            <Skeleton height={12} width={80} />

            <div className="mt-3">
              <Skeleton height={44} />
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t">
          <Skeleton height={44} />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <Skeleton height={35} width={250} />

        <div className="mt-6 space-y-4">
          <Skeleton height={48} />
          <Skeleton height={48} />
          <Skeleton height={48} />
          <Skeleton height={48} />
        </div>

        <div className="mt-6">
          <Skeleton width={180} height={48} />
        </div>
      </div>
    </div>
  );
}
