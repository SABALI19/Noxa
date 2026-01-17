// QuickUpdateModal.jsx
const QuickUpdateModal = ({ goal, onClose, onUpdate }) => {
  const [value, setValue] = useState(goal.progress);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-96">
        <h2 className="text-xl font-bold mb-4">Update Progress for {goal.title}</h2>
        <div className="mb-4">
          <label className="block mb-2">Current Progress (%)</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full"
          />
          <div className="text-center mt-2">
            <span className="text-2xl font-bold">{value}%</span>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">Cancel</button>
          <button 
            onClick={() => onUpdate(goal.id, value)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};