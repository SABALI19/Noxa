// HabitTracker.jsx
const HabitTracker = ({ goal }) => {
  const [streak, setStreak] = useState(0);
  const [weeklyCompletion, setWeeklyCompletion] = useState([false, false, false]);
  
  return (
    <div className="p-4 bg-white rounded-xl shadow">
      <h3 className="font-bold mb-4">Weekly Habit Tracker</h3>
      <div className="flex gap-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
          <div key={day} className="text-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              weeklyCompletion[index] ? 'bg-green-500 text-white' : 'bg-gray-100'
            }`}>
              {weeklyCompletion[index] ? '✓' : day[0]}
            </div>
            <span className="text-xs mt-1">{day}</span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <span className="text-sm text-gray-600">Current Streak: </span>
        <span className="font-bold text-green-600">{streak} days</span>
      </div>
    </div>
  );
};