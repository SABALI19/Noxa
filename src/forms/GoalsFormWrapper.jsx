import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import GoalsForm from '../forms/GoalsForm';

const GoalsFormWrapper = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  
  // Get the goal data if editing (passed via navigation state)
  const goal = location.state?.goal;

  const handleSubmit = (goalData) => {
    // Navigate back to goals page with the goal data
    navigate('/goals', { 
      state: { 
        action: mode === 'edit' ? 'updated' : 'created',
        goalData: {
          ...goalData,
          id: mode === 'edit' ? parseInt(id) : Date.now()
        }
      } 
    });


  };

  const handleCancel = () => {
    navigate('/goals');
  };

  return (
    <GoalsForm
      goal={goal}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      mode={mode}
    />
  );
};

export default GoalsFormWrapper;