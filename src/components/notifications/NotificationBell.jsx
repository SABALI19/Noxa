import React from "react";
import { FiBell } from "react-icons/fi";

const NotificationBell = ({ count = 0 }) => {
  //if no notification return nothing
  if (count === 0) return null;
  return (
    <div className="relative inline-block " >
      <FiBell className="text-2xl text-gray-700"/>

      {/* notification badge  */}
      {count > 0 && (
        <span
       className="absolute -top-1 
       bg-red-600 text-white
       text-[9px] rounded-full h-3 w-3
       flex items-center justify-center ">
        {count}
      </span>
      )}
    </div>
  );
};

export default NotificationBell;
