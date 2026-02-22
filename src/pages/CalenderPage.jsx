import React from "react";
import { Calendar, CheckSquare, ListChecks } from "lucide-react";

const CalenderPage = () => {
  const listItems = [
    { id: 1, title: "Team planning list", due: "Today, 3:00 PM" },
    { id: 2, title: "Sprint review list", due: "Tomorrow, 10:00 AM" },
    { id: 3, title: "Personal errands list", due: "Friday, 6:00 PM" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3D9B9B]/10 flex items-center justify-center">
              <Calendar className="text-[#3D9B9B] dark:text-[#4fb3b3]" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar Lists</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your calendar tools now open here instead of reminders.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ListChecks size={18} className="text-[#3D9B9B] dark:text-[#4fb3b3]" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">{item.title}</h2>
                </div>
                <button
                  type="button"
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  aria-label="Mark as done"
                >
                  <CheckSquare size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.due}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalenderPage;
