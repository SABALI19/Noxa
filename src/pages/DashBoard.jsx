import Header from "../components/Header";
import Sidebar from "../components/layouts/Sidebar";
import React from "react";

const DashBoard = () => {
  return (
    <div className="min-h-screen bg-red-50">
      <Header />

      <div className="flex">
        <Sidebar />

        <div className="flex-1 p-4  bg-[#F6F8F9]">
          Dashboard Content Here
        </div>
      </div>
    </div>
  );
};

export default DashBoard;
